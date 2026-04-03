# Changelog

## [Unreleased]

### Added
- Initial project structure — backend (FastAPI + CrewAI + Anthropic) and frontend (React + Vite + Tailwind)
- CLAUDE.md operating manual with architecture, style guide, constraints, and automation rules
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

### Fixed
- CrewAI LLM model string must use `anthropic/` prefix for LiteLLM routing
- Model updated from `claude-haiku-20240307` → `claude-haiku-4-5-20251001` (account only has access to newer models)

---
