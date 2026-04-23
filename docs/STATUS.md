# Orbit — Project Status

**Last updated:** 2026-04-03
**Current phase:** Mocked end-to-end tests added — ready for deployment
**Overall status:** In progress

---

## Build Progress

| Step | Task | Status |
|---|---|---|
| 1 | Create folder structure | ✅ Complete |
| 2 | Install backend dependencies | ✅ Complete |
| 3 | Write persona definitions | ✅ Complete |
| 4 | Intent detector | ✅ Complete |
| 5 | Persona selector | ✅ Complete |
| 6 | CrewAI Phase 1 (crew.py) | ✅ Complete |
| 7 | Phase 2 debate (debate.py) | ✅ Complete |
| 8 | User steering (steer.py) | ✅ Complete |
| 9 | Summary generator | ✅ Complete |
| 10 | FastAPI wiring (main.py) | ✅ Complete |
| 11 | End-to-end /simulate test | ✅ Complete |
| 12 | Frontend setup + components | ✅ Complete |
| 13 | Frontend build passes | ✅ Complete |
| 14 | Full stack integration test | ✅ Complete |
| 15 | Frontend redesign + intent override flow | ✅ Complete |
| 16 | Mocked backend + frontend automated tests | ✅ Complete |
| 17 | Render deployment | ⬜ Not started |
| 18 | Netlify deployment | ⬜ Not started |

---

## What Is Working
- Backend imports cleanly and `/health` returns `200 {"status":"ok"}`
- Real `/simulate` integration run completed successfully with Anthropic: 5 personas, 5 Phase 1 reactions, 12 Phase 2 debate messages, and a valid 4-field summary
- Real `/steer` integration run completed successfully with 5 continuation messages
- Backend now accepts an optional `intent_override` on `/simulate` so the UI can rerun with a user-selected decision type
- Frontend production build passes locally with Vite (1573 modules transformed)
- Backend mocked integration tests pass via `unittest`
- Frontend mocked end-to-end tests pass via Vitest + jsdom
- Fake streaming with `setTimeout` reveal logic implemented end to end
- Health ping + warming banner on page load
- Two-column redesign implemented: persistent sidebar, main content shell, phase pills, and bottom steer bar
- Intent chips reflect backend detection by default and support manual override reruns
- Persona cards render as sidebar rows with core vs auto-selected badges
- SimulationFeed now shows reactions and debate in the same main panel instead of swapping views
- SummaryPanel matches the new warm-card layout and supports stale-summary messaging after steering
- `.env.example` files now exist for backend and frontend setup

## What Is Blocked
- Nothing blocked in code; deployment is still pending external Render and Netlify setup

## Next Session
1. Deploy backend to Render and set the production `ANTHROPIC_API_KEY`
2. Deploy frontend to Netlify and set `VITE_API_URL` to the Render backend URL
3. Tighten backend CORS from `*` to the final Netlify origin and run browser-level visual QA after deployment
