import logging
import os

import anthropic
from dotenv import load_dotenv

from agents.core_personas import Persona

load_dotenv()

logger = logging.getLogger(__name__)


def _build_steer_prompt(
    message: str,
    conversation_history: list[dict],
    personas: list[Persona],
) -> str:
    persona_descriptions = "\n".join(
        f"- {p['name']}: {p['system_prompt']}"
        for p in personas
    )
    history_lines = []
    for entry in conversation_history:
        speaker = "User" if entry["persona"] == "user" else entry["persona"]
        history_lines.append(f"{speaker}: {entry['message']}")
    history_text = "\n".join(history_lines)

    return (
        f"You are simulating a live debate between {len(personas)} product management personas.\n\n"
        f"The personas:\n{persona_descriptions}\n\n"
        f"The debate so far:\n{history_text}\n\n"
        f"The user has just injected this message into the debate:\n"
        f"User: {message}\n\n"
        f"Generate 3-5 responses from different personas that directly engage with the user's message. "
        f"Personas should stay in character and react to what the user raised. "
        f"They may also respond to each other.\n\n"
        f"Format every message exactly as:\n"
        f"[PersonaName]: message"
    )


def _parse_steer_messages(response_text: str) -> list[dict]:
    """Parse '[PersonaName]: message' lines from the steer response."""
    messages: list[dict] = []
    for line in response_text.splitlines():
        line = line.strip()
        if not line or not line.startswith("["):
            continue
        if "]:" not in line:
            continue
        bracket_end = line.index("]:")
        persona_name = line[1:bracket_end].strip()
        message = line[bracket_end + 2:].strip()
        if persona_name and message:
            messages.append({"persona": persona_name, "message": message})
    return messages


def steer_debate(
    message: str,
    conversation_history: list[dict],
    personas: list[Persona],
) -> list[dict]:
    """Continue the debate after a user steering message.

    Returns a list of dicts: [{"persona": str, "message": str}]
    """
    client = anthropic.Anthropic(
        api_key=os.getenv("ANTHROPIC_API_KEY"),
        timeout=30.0,
    )

    prompt = _build_steer_prompt(message, conversation_history, personas)

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = response.content[0].text.strip()
    except Exception as exc:
        logger.error("Steer API call failed: %s", exc)
        raise

    messages = _parse_steer_messages(response_text)

    if not messages:
        logger.warning("Steer parser returned 0 messages — raw output may be malformed")

    logger.info("Steering complete — %d continuation messages parsed", len(messages))
    return messages
