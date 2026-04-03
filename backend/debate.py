import logging
import os

import anthropic
from dotenv import load_dotenv

from agents.core_personas import Persona

load_dotenv()

logger = logging.getLogger(__name__)

DEBATE_EXCHANGE_COUNT = "8-12"


def _build_debate_prompt(personas: list[Persona], phase1_reactions: list[dict], user_input: str) -> str:
    persona_descriptions = "\n".join(
        f"- {p['name']}: {p['system_prompt']}"
        for p in personas
    )
    reactions_text = "\n".join(
        f"{r['persona']}: {r['message']}"
        for r in phase1_reactions
    )
    return (
        f"You are simulating a live debate between {len(personas)} product management personas "
        f"who have all independently reacted to the same product decision.\n\n"
        f"The original product decision:\n{user_input}\n\n"
        f"The personas and their perspectives:\n{persona_descriptions}\n\n"
        f"Their Phase 1 reactions:\n{reactions_text}\n\n"
        f"Now simulate a debate between these personas. They should directly respond to each "
        f"other's points — agreeing, disagreeing, building on, or challenging what others said. "
        f"Each persona should speak in character. Run for exactly {DEBATE_EXCHANGE_COUNT} exchanges total.\n\n"
        f"Format every message exactly as:\n"
        f"[PersonaName]: message\n\n"
        f"Start the debate now."
    )


def _parse_debate_messages(debate_text: str) -> list[dict]:
    """Parse '[PersonaName]: message' lines into structured dicts."""
    messages: list[dict] = []
    for line in debate_text.splitlines():
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


def run_phase2_debate(
    personas: list[Persona],
    phase1_reactions: list[dict],
    user_input: str,
) -> list[dict]:
    """Run Phase 2: personas debate each other via a direct Anthropic API call.

    Returns a list of dicts: [{"persona": str, "message": str}]
    """
    client = anthropic.Anthropic(
        api_key=os.getenv("ANTHROPIC_API_KEY"),
        timeout=30.0,
    )

    prompt = _build_debate_prompt(personas, phase1_reactions, user_input)

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        debate_text = response.content[0].text.strip()
    except Exception as exc:
        logger.error("Phase 2 debate API call failed: %s", exc)
        raise

    messages = _parse_debate_messages(debate_text)

    if not messages:
        logger.warning("Debate parser returned 0 messages — raw output may be malformed")

    logger.info("Phase 2 complete — %d debate messages parsed", len(messages))
    return messages
