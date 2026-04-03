# CLAUDE.md — Orbit Project Guide

This file is the operating manual for Claude Code working on the Orbit project. Read this file in full before making any changes to the codebase. Follow every section precisely.

---

## 1. Project Overview

**Orbit** is a multi-agent simulation engine for product managers. A PM inputs a free-form idea, feature decision, or PRD, and Orbit spawns 5 AI personas who react independently then debate each other in a live conversation. The output is a structured dashboard with a live debate feed and a 4-section summary report.

**Repository:** github.com/[username]/orbit  
**Author:** Meha Manimaran  
**Version:** v0.1  
**Status:** In development  

---

## 2. Architecture Overview

### Stack

| Layer | Technology |
|---|---|
| Backend framework | FastAPI (Python) |
| Agent orchestration | CrewAI (open source) — Phase 1 only |
| AI model | Anthropic API — Claude Haiku |
| LLM bridge | LiteLLM (used by CrewAI internally) |
| Frontend | React + Vite |
| Styling | Tailwind CSS + Radix UI primitives |
| Backend hosting | Render (working directory: `backend/`) |
| Frontend hosting | Netlify |
| Version control | GitHub |

### Folder Structure

```
orbit/
├── backend/
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── core_personas.py        # 3 always-present personas
│   │   └── context_personas.py     # 12 context-specific personas pool
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── reaction_tasks.py       # Phase 1 independent reaction tasks
│   │   └── debate_tasks.py         # Phase 2 debate tasks
│   ├── crew.py                     # CrewAI orchestration — Phase 1 only
│   ├── intent_detector.py          # Classifies decision type from input
│   ├── persona_selector.py         # Deterministic lookup table
│   ├── debate.py                   # Phase 2 — direct Anthropic API call
│   ├── steer.py                    # User steering — direct Anthropic API call
│   ├── summary_generator.py        # Summary — direct Anthropic API call
│   ├── main.py                     # FastAPI entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── InputPanel.jsx
│   │   │   ├── PersonaCards.jsx
│   │   │   ├── SimulationFeed.jsx
│   │   │   ├── SteerInput.jsx
│   │   │   └── SummaryPanel.jsx
│   │   ├── pages/
│   │   │   └── index.jsx
│   │   ├── lib/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docs/
│   ├── CHANGELOG.md
│   ├── STATUS.md
│   └── DECISIONS.md
├── CLAUDE.md                       # This file
├── .env                            # Never committed
├── .gitignore
└── README.md
```

### API Call Architecture

Orbit makes the following API calls per simulation run:

| Step | Method | Model |
|---|---|---|
| Intent detection | Direct Anthropic call | Claude Haiku |
| Persona selection | Lookup table — no API call | — |
| Phase 1 reactions | CrewAI — 5 sequential tasks | Claude Haiku via LiteLLM |
| Phase 2 debate | Direct Anthropic call | Claude Haiku |
| User steering | Direct Anthropic call | Claude Haiku |
| Summary generation | Direct Anthropic call | Claude Haiku |

### API Endpoints

```
POST /simulate
  Request:  { "input": "string" }
  Response: { "intent", "personas", "phase1_reactions", "phase2_debate", "summary" }

POST /steer
  Request:  { "message": "string", "conversation_history": [...], "personas": [...] }
  Response: { "debate_continuation": [...] }

GET /health
  Response: { "status": "ok" }
```

### Conversation History Shape

```json
[
  { "persona": "The Skeptic", "phase": "debate", "message": "..." },
  { "persona": "user", "phase": "steer", "message": "..." }
]
```

### Persona Selection Logic

Intent detection classifies input into one of four categories. Selection is deterministic:

```python
PERSONA_SELECTION = {
    "feature_decision":     ["power_user", "builder"],
    "strategic_decision":   ["investor", "competitor"],
    "launch_announcement":  ["evangelist", "reluctant_adopter"],
    "timing_strategy":      ["timing_critic", "executive_stakeholder"]
}
```

Default fallback: `feature_decision`

### Streaming

Orbit uses fake streaming. The `/simulate` endpoint returns one complete JSON blob. The frontend reveals messages sequentially using `setTimeout` delays with a CSS typing indicator between messages. This is intentional — real SSE is out of scope for v0.1.

### Cold Start Handling

Render's free tier has cold starts of 30–60 seconds. On page load, the frontend pings `/health` silently. If the response takes more than 2 seconds, a "Warming up the simulation engine..." banner is shown. The Run Simulation button is disabled until the backend responds.

---

## 3. Design Style Guide

Orbit's aesthetic is clean, dark, and technical. It should feel like a tool a senior PM would trust, not a toy.

### Core Principles

- **Minimal** — every element earns its place. No decorative components, no gradients, no shadows unless they serve a function
- **Dark first** — the default theme is dark. Light mode is not in scope for v0.1
- **Generous whitespace** — breathing room between elements is the primary design tool
- **Typography-led** — hierarchy is established through font weight and size, not colour
- **Purposeful colour** — colour is used for meaning (status, persona identity, phase labels) not decoration

### Colour Palette

```js
colors: {
  orbit: {
    primary:   "#6C63FF",   // purple  — brand, buttons, active states
    secondary: "#1A1A2E",   // dark navy — page background
    accent:    "#E94560",   // coral red — highlights, badges, warnings
    surface:   "#16213E",   // lighter navy — cards, panels
    border:    "#2A2A4A",   // subtle border colour
    muted:     "#A8A8B3",   // secondary text, placeholders
    text:      "#E8E8F0",   // primary text
    success:   "#4CAF82",   // green — positive sentiment
    warning:   "#F0A500",   // amber — mixed sentiment
    danger:    "#E94560",   // red — negative sentiment, concerns
  }
}
```

### Typography

- **Font:** System font stack — `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Sizes:** Use Tailwind defaults — `text-sm` for secondary, `text-base` for body, `text-lg` for subheadings, `text-xl`/`text-2xl` for headings
- **Weights:** `font-normal` for body, `font-medium` for labels, `font-semibold` for headings
- **Line height:** `leading-relaxed` for body text, `leading-tight` for headings

### Component Rules

- **Buttons:** Rounded (`rounded-lg`), solid background, no outlines. Primary actions use `orbit-primary`. Disabled state at 40% opacity
- **Cards:** Dark surface (`orbit-surface`), subtle border (`orbit-border`), `rounded-xl`, `p-6` padding
- **Input fields:** Dark background, `orbit-border` border, focus ring in `orbit-primary`, `rounded-lg`
- **Badges:** Small, pill-shaped (`rounded-full`), uppercase text, `text-xs`. Core personas use purple, context personas use coral
- **Avatar initials:** Circular, coloured background unique per persona, white initial letter, `font-semibold`
- **Dividers:** `orbit-border` colour, 1px, used sparingly

### Persona Avatar Colours

Assign a fixed colour per persona so they are visually distinguishable across the feed:

```js
const PERSONA_COLOURS = {
  end_user:              "#6C63FF",  // purple
  skeptic:               "#E94560",  // coral
  devils_advocate:       "#F0A500",  // amber
  power_user:            "#4CAF82",  // green
  builder:               "#00BCD4",  // cyan
  support_rep:           "#FF7043",  // orange
  investor:              "#AB47BC",  // violet
  competitor:            "#EF5350",  // red
  market_analyst:        "#26A69A",  // teal
  evangelist:            "#66BB6A",  // light green
  reluctant_adopter:     "#FFA726",  // light amber
  regulator:             "#78909C",  // blue grey
  timing_critic:         "#EC407A",  // pink
  executive_stakeholder: "#5C6BC0",  // indigo
  newcomer:              "#8D6E63",  // brown
}
```

### Animation

- Use `transition-all duration-200` for hover states
- Use `transition-opacity duration-300` for fade-ins
- Typing indicator: three dots pulsing with `animate-pulse`
- Message reveal: fade in with a short delay between each — `opacity-0` to `opacity-100`
- No bouncing, no sliding, no elaborate keyframes

### What to Avoid

- No gradients on backgrounds
- No drop shadows except subtle `shadow-sm` on cards
- No rounded corners above `rounded-xl`
- No emojis in UI copy
- No centered body text — left-aligned always
- No more than 3 colours visible at once in any single view
- No placeholder images or icons that are purely decorative

---

## 4. Constraints and Policies

### Security — Non-negotiable

- **Never expose API keys in code.** All keys live in `.env` files only
- **Never hardcode any key, token, or secret** anywhere in the codebase — not in comments, not in test files, not in example code
- **Never commit `.env` files.** The `.gitignore` must include `.env` before the first commit
- **Never log API keys** — do not print them, do not include them in error messages
- **Never include real API keys in documentation or README examples** — use `your_key_here` as a placeholder
- If a key is accidentally committed, treat it as compromised immediately — rotate it in the Anthropic console and force-push a cleaned history

### Environment Variables

- All environment variables are loaded via `python-dotenv` in the backend and `import.meta.env` in the frontend
- Backend variables go in `backend/.env`
- Frontend variables go in `frontend/.env`
- All frontend environment variables must be prefixed with `VITE_` to be exposed to the client
- Never pass backend secrets to the frontend under any circumstances

### Code Quality

- **No dead code** — do not leave commented-out blocks, unused imports, or unused functions in the codebase
- **No hardcoded strings** — persona names, system prompts, intent labels, and endpoint URLs all live in dedicated files or environment variables, never inline
- **Error handling is required** — every API call must have a try/except (backend) or try/catch (frontend). Silent failures are not acceptable
- **No print statements in production code** — use Python's `logging` module in the backend. Remove all `console.log` statements before deployment
- **Type hints required** in all Python functions — use Pydantic models for all request and response bodies in FastAPI
- **Descriptive variable names** — no single-letter variables outside of loop indices. `persona_list` not `pl`, `user_input` not `ui`

### Dependencies

- **Do not add dependencies without a clear reason.** Every package in `requirements.txt` and `package.json` must be necessary
- **Pin major versions** in `requirements.txt` — use `fastapi>=0.100.0` not just `fastapi`
- **Do not install global packages** — everything goes inside the virtual environment
- **Do not use deprecated packages** — check the package's last release date before adding it
- **Frontend dependencies:** use only `@radix-ui` primitives, `lucide-react` for icons, `clsx` and `tailwind-merge` for class utilities. Do not add UI component libraries without explicit approval

### API Usage

- **Always use Claude Haiku** (`claude-haiku-4-5-20251001`) — do not switch to Sonnet or Opus without approval. Cost control is important
- **Set max_tokens explicitly** on every Anthropic API call — never leave it unset
- **Add a timeout** to every API call — backend calls should timeout at 30 seconds
- **Never retry automatically** on failure — surface the error to the user instead

---

## 5. Repository Etiquette

### Branch Strategy

- `main` — production-ready code only. Never commit directly to main during active development
- `dev` — active development branch. All work happens here
- Feature branches — `feature/phase1-reactions`, `feature/summary-panel`, etc. for larger additions
- Merge to `dev` first, then `dev` to `main` when a working version is complete

### Commit Messages

Follow this format exactly:

```
type: short description in lowercase

types:
  feat     — new feature
  fix      — bug fix
  refactor — code change that is not a fix or feature
  style    — formatting, whitespace, no logic change
  docs     — documentation only
  chore    — build process, dependency updates
```

Examples:
```
feat: add intent detector with haiku classification
fix: correct persona lookup for timing_strategy intent
refactor: split debate logic into standalone module
docs: update CHANGELOG with phase 1 completion
chore: pin fastapi version in requirements.txt
```

- Keep commit messages under 72 characters
- One logical change per commit — do not batch unrelated changes
- Never commit "WIP", "temp", "test123", or similar placeholder messages

### What Never Gets Committed

- `.env` files
- `venv/` or any virtual environment folder
- `node_modules/`
- `dist/` or `build/` output folders
- `.DS_Store` or any OS-generated files
- `*.pyc` or `__pycache__/`
- Any file containing a real API key or secret

### Pull Requests

- All merges from `dev` to `main` go through a pull request
- PR title follows the same format as commit messages
- Include a one-paragraph description of what changed and why

---

## 6. Commands That Do Not Need Approval

Claude Code may run the following commands at any time without asking:

### File operations
```bash
mkdir -p                   # create directories
touch                      # create empty files
cp                         # copy files
mv                         # move or rename files
cat                        # read file contents
```

### Git operations
```bash
git status
git diff
git log
git add .
git commit -m "..."
git push origin dev
git checkout -b feature/...
git checkout dev
git pull origin dev
```

### Python
```bash
python --version
pip install -r requirements.txt
pip list
python -m pytest
uvicorn main:app --reload --port 8000
```

### Node / npm
```bash
node --version
npm install
npm run dev
npm run build
npm run lint
```

### Linting and formatting
```bash
black .                    # Python formatting
isort .                    # Python import sorting
eslint src/                # JavaScript linting
prettier --write src/      # JavaScript formatting
```

### Reading documentation
```bash
cat CLAUDE.md
cat docs/STATUS.md
cat docs/CHANGELOG.md
```

### Commands that DO need approval before running
- Any `git push origin main` — always confirm before pushing to main
- Any `pip install [new package]` not already in requirements.txt
- Any `npm install [new package]` not already in package.json
- Any database migration or schema change
- Any change to environment variable names
- Deleting files that are not obviously temporary

---

## 7. Automation — Documentation Updates

Claude Code must keep the following three files updated automatically as part of every working session. Do not wait to be asked.

### 7.1 CHANGELOG.md

Location: `docs/CHANGELOG.md`

Update this file every time a meaningful change is made. Format:

```markdown
# Changelog

## [Unreleased]

### Added
- Intent detector with 4-category classification using Claude Haiku

### Fixed
- Persona lookup returning wrong context personas for timing_strategy intent

### Changed
- Switched Phase 2 from CrewAI tasks to direct Anthropic call

---

## [0.1.0] — 2026-04-02

### Added
- Initial project structure
- FastAPI backend scaffold
- Core persona definitions
```

Rules:
- Every `feat` commit gets an entry under Added
- Every `fix` commit gets an entry under Fixed
- Every `refactor` or `chore` gets an entry under Changed
- Group entries under `[Unreleased]` until a version is tagged
- When `dev` is merged to `main`, move Unreleased entries under a new version number with today's date

### 7.2 STATUS.md

Location: `docs/STATUS.md`

This file is the single source of truth for what is working, what is in progress, and what is blocked. Update it at the end of every working session.

Format:

```markdown
# Orbit — Project Status

**Last updated:** 2026-04-02  
**Current phase:** Backend development  
**Overall status:** In progress  

---

## Build Progress

| Step | Task | Status |
|---|---|---|
| 1 | Create folder structure | ✅ Complete |
| 2 | Write persona definitions | ✅ Complete |
| 3 | Intent detector | 🔄 In progress |
| 4 | Persona selector | ⬜ Not started |
| 5 | CrewAI Phase 1 | ⬜ Not started |
| 6 | Phase 2 debate | ⬜ Not started |
| 7 | User steering | ⬜ Not started |
| 8 | Summary generator | ⬜ Not started |
| 9 | FastAPI wiring | ⬜ Not started |
| 10 | Frontend setup | ⬜ Not started |
| 11 | UI components | ⬜ Not started |
| 12 | API connection | ⬜ Not started |
| 13 | Render deployment | ⬜ Not started |
| 14 | Netlify deployment | ⬜ Not started |

---

## What Is Working
- [list things that run end to end without errors]

## What Is Blocked
- [list anything blocking progress and why]

## Next Session
- [list the exact next 3 things to do]
```

Status icons:
- ✅ Complete — works end to end, tested
- 🔄 In progress — currently being built
- ⬜ Not started — not yet touched
- ❌ Blocked — cannot proceed, needs decision or fix

### 7.3 DECISIONS.md

Location: `docs/DECISIONS.md`

Every time an architectural decision is made — whether in conversation, in code, or during debugging — log it here. This is the record of why the codebase looks the way it does.

Format:

```markdown
# Architecture Decisions

## 2026-04-02 — Use fake streaming instead of SSE

**Decision:** The /simulate endpoint returns one complete JSON blob. The frontend reveals messages sequentially using setTimeout delays.

**Reason:** Real SSE adds significant backend complexity and is not worth the tradeoff for a portfolio project. The visual result is identical to a real user.

**Alternatives considered:** Server-Sent Events, WebSockets

**Revisit if:** The project grows into a real product with paying users.

---

## 2026-04-02 — CrewAI used only for Phase 1

**Decision:** CrewAI is used only for Phase 1 independent reactions. Phase 2, steering, and summary all call Anthropic directly.

**Reason:** CrewAI's value is distinct tasks for distinct agents. Phase 2 is one conversation context — one LLM call generating all voices. Using CrewAI there would be artificial overhead with no architectural benefit.

**Alternatives considered:** Full CrewAI pipeline for all phases

**Revisit if:** Phase 2 needs truly independent agent state management.
```

Log a decision entry for:
- Any time a technology is chosen over an alternative
- Any time a spec decision is changed during implementation
- Any time a bug reveals a design assumption that needed to be corrected
- Any time a dependency is added or removed

---

## 8. Project Spec Reference

The full product and technical specifications live here:

- `docs/Orbit_Product_Spec.md` — product overview, personas, simulation phases, dashboard layout
- `docs/Orbit_Technical_Spec.md` — full technical implementation guide, build order, deployment

If there is ever a conflict between something in this CLAUDE.md and the technical spec, follow CLAUDE.md. It is the more up-to-date document.

---

## 9. Definition of Done

A feature is considered complete when:

1. It runs without errors
2. Error states are handled and surfaced to the user
3. No API keys or secrets appear anywhere in the code
4. CHANGELOG.md has been updated
5. STATUS.md reflects the current state
6. The code has been committed to `dev` with a descriptive commit message
7. Any new architectural decisions have been logged in DECISIONS.md