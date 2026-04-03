import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.context_personas import Persona
from agents.core_personas import CORE_PERSONAS
from crew import run_phase1_reactions
from debate import run_phase2_debate
from intent_detector import detect_intent
from persona_selector import select_context_personas
from steer import steer_debate
from summary_generator import generate_summary

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Orbit API", version="0.1.0")

# Allow localhost dev and any Netlify subdomain.
# Tighten allow_origins to the specific Netlify URL after deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request / Response models ---

class SimulateRequest(BaseModel):
    input: str


class ConversationEntry(BaseModel):
    persona: str
    phase: str
    message: str


class SteerRequest(BaseModel):
    message: str
    conversation_history: list[ConversationEntry]
    personas: list[dict]


# --- Endpoints ---

@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/simulate")
def simulate(request: SimulateRequest) -> dict:
    """Run a full simulation: intent → personas → Phase 1 → Phase 2 → summary."""
    logger.info("Simulation started")

    try:
        intent = detect_intent(request.input)
    except Exception as exc:
        logger.error("Intent detection failed: %s", exc)
        raise HTTPException(status_code=500, detail="Intent detection failed") from exc

    try:
        context_personas: list[Persona] = select_context_personas(intent)
        all_personas: list[Persona] = CORE_PERSONAS + context_personas
    except Exception as exc:
        logger.error("Persona selection failed: %s", exc)
        raise HTTPException(status_code=500, detail="Persona selection failed") from exc

    try:
        phase1_reactions = run_phase1_reactions(all_personas, request.input)
    except Exception as exc:
        logger.error("Phase 1 reactions failed: %s", exc)
        raise HTTPException(status_code=500, detail="Phase 1 reactions failed") from exc

    try:
        phase2_debate = run_phase2_debate(all_personas, phase1_reactions, request.input)
    except Exception as exc:
        logger.error("Phase 2 debate failed: %s", exc)
        raise HTTPException(status_code=500, detail="Phase 2 debate failed") from exc

    try:
        summary = generate_summary(phase1_reactions, phase2_debate)
    except Exception as exc:
        logger.error("Summary generation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Summary generation failed") from exc

    logger.info("Simulation complete")
    return {
        "intent": intent,
        "personas": all_personas,
        "phase1_reactions": phase1_reactions,
        "phase2_debate": phase2_debate,
        "summary": summary,
    }


@app.post("/steer")
def steer(request: SteerRequest) -> dict:
    """Inject a user message into an in-progress debate and get persona responses."""
    logger.info("Steer request received")

    history = [entry.model_dump() for entry in request.conversation_history]

    try:
        continuation = steer_debate(request.message, history, request.personas)
    except Exception as exc:
        logger.error("Steering failed: %s", exc)
        raise HTTPException(status_code=500, detail="Steering failed") from exc

    return {"debate_continuation": continuation}
