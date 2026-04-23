import logging

from agents.context_personas import CONTEXT_PERSONAS, Persona

logger = logging.getLogger(__name__)

PERSONA_SELECTION: dict[str, list[str]] = {
    "feature_decision":    ["power_user", "builder"],
    "strategic_decision":  ["investor", "competitor"],
    "launch_announcement": ["evangelist", "reluctant_adopter"],
    "timing_strategy":     ["timing_critic", "executive_stakeholder"],
}

DEFAULT_INTENT = "feature_decision"


def select_context_personas(intent: str) -> list[Persona]:
    """Return the 2 context personas for a given intent label.

    Falls back to feature_decision personas if the intent is unrecognised.
    """
    persona_ids = PERSONA_SELECTION.get(intent)
    if persona_ids is None:
        logger.warning("Unrecognised intent '%s', falling back to '%s'", intent, DEFAULT_INTENT)
        persona_ids = PERSONA_SELECTION[DEFAULT_INTENT]

    selected = [p for p in CONTEXT_PERSONAS if p["id"] in persona_ids]

    if len(selected) != 2:
        logger.error("Expected 2 context personas for intent '%s', got %d", intent, len(selected))

    return selected
