import json
import logging
import os
import re

import anthropic
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SUMMARY_SYSTEM_PROMPT = """You are summarising a product management simulation debate.
Given the full debate transcript, return a JSON object with exactly these 4 fields:
{
  "overall_sentiment": "one sentence describing the overall tone — positive, mixed, or negative",
  "strongest_support": "which persona was most in favour and the core reason why",
  "biggest_concern": "the single most important objection or risk raised across the debate",
  "explore_next": "one concrete question or blind spot the simulation surfaced that the user had not considered"
}
Return only valid JSON. No explanation. No markdown."""

REQUIRED_FIELDS = {"overall_sentiment", "strongest_support", "biggest_concern", "explore_next"}


def _format_transcript(phase1_reactions: list[dict], phase2_debate: list[dict]) -> str:
    lines: list[str] = ["=== Phase 1 — Individual Reactions ==="]
    for entry in phase1_reactions:
        lines.append(f"{entry['persona']}: {entry['message']}")
    lines.append("\n=== Phase 2 — Debate ===")
    for entry in phase2_debate:
        lines.append(f"{entry['persona']}: {entry['message']}")
    return "\n".join(lines)


def _strip_markdown_fences(text: str) -> str:
    """Remove ```json ... ``` or ``` ... ``` wrappers if present."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def generate_summary(phase1_reactions: list[dict], phase2_debate: list[dict]) -> dict:
    """Synthesise the full simulation into a 4-section summary.

    Returns a dict with keys: overall_sentiment, strongest_support,
    biggest_concern, explore_next.
    """
    client = anthropic.Anthropic(
        api_key=os.getenv("ANTHROPIC_API_KEY"),
        timeout=30.0,
    )

    transcript = _format_transcript(phase1_reactions, phase2_debate)

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            system=SUMMARY_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"Here is the debate transcript:\n\n{transcript}"}],
        )
        raw_text = response.content[0].text.strip()
    except Exception as exc:
        logger.error("Summary generation API call failed: %s", exc)
        raise

    cleaned = _strip_markdown_fences(raw_text)

    try:
        summary = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("Summary response is not valid JSON: %s\nRaw text: %s", exc, raw_text)
        raise ValueError(f"Summary generation returned invalid JSON: {exc}") from exc

    missing = REQUIRED_FIELDS - set(summary.keys())
    if missing:
        logger.error("Summary response missing required fields: %s", missing)
        raise ValueError(f"Summary response missing fields: {missing}")

    logger.info("Summary generation complete")
    return summary
