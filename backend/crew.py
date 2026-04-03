import logging
import os

from crewai import Agent, Crew, LLM, Task
from dotenv import load_dotenv

from agents.core_personas import Persona

load_dotenv()

logger = logging.getLogger(__name__)


def run_phase1_reactions(personas: list[Persona], user_input: str) -> list[dict]:
    """Run Phase 1: each persona independently reacts to the user input.

    Uses CrewAI with 5 sequential tasks, one per persona.
    Each agent is configured with Claude Haiku via LiteLLM.

    Returns a list of dicts: [{"persona": str, "persona_id": str, "message": str}]
    """
    llm = LLM(
        model="anthropic/claude-haiku-4-5-20251001",
        api_key=os.getenv("ANTHROPIC_API_KEY"),
    )

    agents: list[Agent] = []
    tasks: list[Task] = []

    for persona in personas:
        agent = Agent(
            role=persona["name"],
            goal=persona["focus"],
            backstory=persona["system_prompt"],
            llm=llm,
            verbose=False,
        )
        task = Task(
            description=(
                f"React to the following product decision as {persona['name']}. "
                f"Input: {user_input}. "
                "Give your honest reaction in 2-4 sentences covering what you think, "
                "what you like, and what concerns you."
            ),
            expected_output=(
                "A 2-4 sentence honest reaction covering what you think, "
                "what you like, and what concerns you."
            ),
            agent=agent,
        )
        agents.append(agent)
        tasks.append(task)

    crew = Crew(agents=agents, tasks=tasks, verbose=False)

    try:
        crew_output = crew.kickoff()
    except Exception as exc:
        logger.error("CrewAI Phase 1 kickoff failed: %s", exc)
        raise

    reactions: list[dict] = []
    for i, task_output in enumerate(crew_output.tasks_output):
        reactions.append(
            {
                "persona": personas[i]["name"],
                "persona_id": personas[i]["id"],
                "message": task_output.raw.strip(),
            }
        )

    logger.info("Phase 1 complete — %d reactions collected", len(reactions))
    return reactions
