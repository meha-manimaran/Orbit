# Changelog

## [Unreleased]

### Added
- Initial project structure — backend (FastAPI + CrewAI + Anthropic) and frontend (React + Vite + Tailwind)
- docs/ folder with CHANGELOG, STATUS, and DECISIONS tracking files
- `agents/core_personas.py` — 3 always-present personas (End User, Skeptic, Devil's Advocate)
- `agents/context_personas.py` — 12 context-specific personas across all 4 intent categories
- `intent_detector.py` — Claude Haiku classification into 4 intent labels with fallback
- `persona_selector.py` — deterministic lookup table mapping intent to 2 context personas
- `crew.py` — CrewAI Phase 1 orchestration with 5 sequential tasks via LiteLLM + Haiku
- `debate.py` — Phase 2 debate via direct Anthropic call with structured [PersonaName]: message parser
- `steer.py` — user steering via direct Anthropic call, continues debate from conversation history
- `summary_generator.py` — 4-field JSON summary via direct Anthropic call with markdown fence stripping
- `main.py` — FastAPI with /simulate, /steer, /health endpoints and Pydantic request models
- `frontend/src/lib/constants.js` — PERSONA_COLOURS, NAME_TO_ID, CORE_PERSONA_IDS
- `frontend/src/lib/api.js` — runSimulation and steerConversation API client
- `frontend/src/App.jsx` — health ping on mount, warming banner, backendReady state
- `frontend/src/pages/index.jsx` — full state machine: reveal logic, steer flow, reset
- `frontend/src/components/InputPanel.jsx` — textarea with auto-resize, run button
- `frontend/src/components/PersonaCards.jsx` — staggered fade-in cards with avatar circles and type badges
- `frontend/src/components/SimulationFeed.jsx` — scrollable feed with phase headers, typing dots, auto-scroll
- `frontend/src/components/SteerInput.jsx` — inline input for steering Phase 2
- `frontend/src/components/SummaryPanel.jsx` — 2x2 summary grid with sentiment colouring, copy button
- `frontend/postcss.config.js` and `frontend/src/index.css` — Tailwind + animation keyframes
- `backend/.env.example` and `frontend/.env.example` for local and deployment setup
- `/simulate` now accepts an optional `intent_override` so the frontend can rerun with a user-selected decision type
- Redesigned Orbit UI shell based on the provided HTML mockup: persistent sidebar, phase pills, reaction grid, live debate feed, and bottom steer bar
- Mocked automated tests: backend `unittest` coverage for `/simulate` and `/steer`, plus frontend Vitest coverage for the full run/override/steer flow

### Fixed
- CrewAI LLM model string must use `anthropic/` prefix for LiteLLM routing
- Model updated from `claude-haiku-20240307` → `claude-haiku-4-5-20251001`
- CSS @import must precede @tailwind directives

### Changed
- Verified the local integration path end to end: backend import, `/health`, real `/simulate`, real `/steer`, and frontend production build
- Frontend flow now prioritises the redesign layout: reactions, debate, and summary live in one shell instead of replacing each other as separate views
- README now documents how to run the backend and frontend test suites locally

---
