import logging
import os

import anthropic
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

VALID_INTENTS = {
    "feature_decision",
    "strategic_decision",
    "launch_announcement",
    "timing_strategy",
}
DEFAULT_INTENT = "feature_decision"

INTENT_SYSTEM_PROMPT = """You are an intent classifier for a product management simulation tool.
Given a user's input, classify it into exactly one of these four categories:
- feature_decision: evaluating a new feature, product change, or UX decision
- strategic_decision: evaluating a market move, pricing, positioning, or GTM plan
- launch_announcement: planning a product launch or public-facing announcement
- timing_strategy: questioning whether now is the right time for something

Respond with only the category label. No explanation."""


def detect_intent(user_input: str) -> str:
    """Classify user input into one of four intent categories.

    Returns a valid intent label. Falls back to DEFAULT_INTENT on any error.
    """
    client = anthropic.Anthropic(
        api_key=os.getenv("ANTHROPIC_API_KEY"),
        timeout=30.0,
    )

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=20,
            system=INTENT_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_input}],
        )
        label = response.content[0].text.strip().lower()

        if label not in VALID_INTENTS:
            logger.warning("Intent detection returned unknown label '%s', defaulting to '%s'", label, DEFAULT_INTENT)
            return DEFAULT_INTENT

        logger.info("Detected intent: %s", label)
        return label

    except Exception as exc:
        logger.error("Intent detection failed: %s", exc)
        return DEFAULT_INTENT
