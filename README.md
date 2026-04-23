# Orbit

Orbit is a multi-agent product decision simulator for PMs, founders, and product teams.

You give Orbit a product idea, launch plan, or strategic question. The app detects the decision type, selects a panel of AI personas, generates independent reactions, runs a structured debate, and returns a concise summary of the strongest support, biggest concern, and what to explore next.

This project is also a portfolio build. It was developed as part of a hands-on learning process across LLM application design, agent orchestration, backend API design, frontend state management, and deployment-oriented architecture. The goal was not just to ship a working app, but to show how I think, build, test, and iterate while learning in public.

This repo is set up as a bring-your-own-key project: you run it with your own Anthropic API key.

## What It Does

- Detects whether a prompt is a feature, strategy, launch, or timing decision
- Combines 3 core personas with 2 context-specific personas
- Generates Phase 1 independent reactions
- Generates a Phase 2 multi-persona debate
- Lets the user steer the debate after the initial run
- Produces a structured 4-part summary
- Ships with a React frontend and FastAPI backend

## Why I Built It

I built Orbit to explore a practical question: what does a useful multi-agent product workflow actually look like outside of a demo?

This repo is meant to demonstrate:

- LLM application design with clear system boundaries
- Multi-step backend orchestration across different generation phases
- Prompt-driven persona simulation with structured outputs
- API design with FastAPI and typed request models
- Frontend state management for progressive reveal, steering, and error handling
- Pragmatic testing for an app that depends on external model APIs

It is intentionally the kind of project that sits between learning exercise and production-style build: ambitious enough to require real engineering decisions, but scoped tightly enough to finish and iterate on.

## PM Perspective

I approached Orbit from the perspective of a product manager trying to become more technically hands-on.

From a PM standpoint, the project started with a product question, not a technology question: if a PM is making a feature, launch, or strategy decision, what kind of feedback would actually help before committing roadmap time? I wanted something more useful than a single chatbot answer. That led to the core product idea: simulate multiple stakeholder perspectives, force disagreement into the workflow, and turn the output into a compact summary that supports decision-making.

Building it myself was part of the point. I wanted direct experience with the implementation constraints behind AI products: prompt design, orchestration tradeoffs, error handling, API contracts, UI state flow, and the difference between something that sounds compelling in a spec and something that actually works in code.

This repo reflects that PM-to-builder mindset:

- Start with the user problem and decision workflow
- Translate that into a concrete product interaction
- Make explicit tradeoffs on scope, speed, and architecture
- Build enough of the system to test whether the idea is genuinely useful
- Use the implementation process itself to sharpen product judgment

## Stack

- Backend: Python, FastAPI, CrewAI, Anthropic SDK, LiteLLM
- Frontend: React, Vite, Tailwind CSS
- Local tests: `unittest` for backend, `vitest` for frontend
- Intended deployment: Render for backend, Netlify for frontend

## Architecture

Orbit uses a split architecture:

- `backend/` handles intent detection, persona selection, generation, and API endpoints
- `frontend/` handles the simulation workspace, reveal flow, steering UI, and summary presentation

Generation flow:

1. `POST /simulate` receives the user prompt
2. The backend detects intent, unless the user manually overrides it
3. Two context personas are selected deterministically for that intent
4. CrewAI generates individual persona reactions
5. Anthropic generates the debate transcript
6. Anthropic generates the structured summary
7. The frontend reveals the output progressively to simulate live flow

## Personas

Always included:

- The End User
- The Skeptic
- The Devil's Advocate

Context personas are selected based on the decision type. Current mappings:

- `feature_decision`: Power User, Builder
- `strategic_decision`: Investor, Competitor
- `launch_announcement`: Evangelist, Reluctant Adopter
- `timing_strategy`: Timing Critic, Executive Stakeholder

## Use Your Own API Key

Orbit does not include a shared API key.

Create `backend/.env`:

```env
ANTHROPIC_API_KEY=your_key_here
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

Example templates already exist:

- `backend/.env.example`
- `frontend/.env.example`

## Local Setup

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs on `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## API

### `GET /health`

Returns:

```json
{ "status": "ok" }
```

### `POST /simulate`

Request:

```json
{
  "input": "Should we add AI meeting notes?",
  "intent_override": null
}
```

Response shape:

```json
{
  "intent": "feature_decision",
  "intent_source": "detected",
  "personas": [],
  "phase1_reactions": [],
  "phase2_debate": [],
  "summary": {
    "overall_sentiment": "",
    "strongest_support": "",
    "biggest_concern": "",
    "explore_next": ""
  }
}
```

### `POST /steer`

Request:

```json
{
  "message": "What if we made it opt-in?",
  "conversation_history": [],
  "personas": []
}
```

Response:

```json
{
  "debate_continuation": []
}
```

## Testing

Backend mocked integration tests:

```bash
python -m unittest discover -s backend/tests -p "test*.py" -v
```

Frontend mocked UI tests:

```bash
cd frontend
npm test -- --run
```

Frontend production build:

```bash
cd frontend
npm run build
```

## Current Status

Verified locally in this repo:

- Backend tests pass
- Frontend tests pass
- Frontend production build passes
- Frontend health-check handling is wired so the UI stays disabled if the backend is unavailable

Not fully production-hardened yet:

- Backend CORS is still open with `allow_origins=["*"]`
- Live Anthropic behavior is not covered by automated tests
- Deployment config is documented, but Render and Netlify setup still need to be completed

## Deployment

### Backend on Render

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variable: `ANTHROPIC_API_KEY`

### Frontend on Netlify

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `frontend/dist`
- Environment variable: `VITE_API_URL=https://your-render-backend-url.onrender.com`

After deployment, tighten backend CORS to the real frontend origin.

## Repository Layout

```text
backend/
  agents/
  tests/
  crew.py
  debate.py
  intent_detector.py
  main.py
  persona_selector.py
  steer.py
  summary_generator.py

frontend/
  src/
  package.json
  vite.config.js

docs/
  CHANGELOG.md
  DECISIONS.md
  STATUS.md
```

## Notes

- The UI uses fake streaming on the frontend rather than SSE
- CrewAI is used for Phase 1 reactions only
- Debate, steering, and summary generation use direct Anthropic calls
- Intent override is supported so users can rerun the same prompt through a different decision lens
