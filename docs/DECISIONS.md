# Architecture Decisions

## 2026-04-02 — Use fake streaming instead of SSE

**Decision:** The /simulate endpoint returns one complete JSON blob. The frontend reveals messages sequentially using setTimeout delays with a CSS typing indicator between messages.

**Reason:** Real SSE adds significant backend complexity and changes the entire endpoint contract. For a portfolio project, the visual result is identical to a real user. If real streaming is added later it is a backend-only change — the frontend reveal logic stays the same.

**Alternatives considered:** Server-Sent Events, WebSockets

**Revisit if:** The project grows into a real product with paying users.

---

## 2026-04-02 — CrewAI used only for Phase 1

**Decision:** CrewAI is used only for Phase 1 independent reactions. Phase 2, steering, and summary all call Anthropic directly.

**Reason:** CrewAI's value is distinct tasks for distinct agents with separate system prompts and roles. Phase 2 is a conversation — one context window where all personas interact. Running that through CrewAI would mean one agent generating all voices anyway, so CrewAI adds no architectural value there.

**Alternatives considered:** Full CrewAI pipeline for all phases

**Revisit if:** Phase 2 needs truly independent agent state management.

---

## 2026-04-02 — Deterministic persona selection (no AI call)

**Decision:** Persona selection uses a hardcoded lookup table keyed on intent label. No second API call for selection.

**Reason:** Faster, cheaper, and more predictable. The intent detection call already classifies the input — selection is a mechanical consequence of that classification.

**Alternatives considered:** Second Claude call to dynamically select the most relevant personas

**Revisit if:** More nuanced persona matching is needed in v0.2.

---

## 2026-04-02 — Phase 1 tasks run sequentially (not parallel)

**Decision:** The 5 CrewAI reaction tasks run sequentially for v0.1.

**Reason:** Keeps the code straightforward and debuggable. Speed optimisation is premature before the simulation works correctly end to end.

**Alternatives considered:** asyncio.gather to parallelise all 5 tasks

**Revisit if:** Total run time exceeds acceptable limits after the first working version.

---

## 2026-04-02 — Render + Netlify deployment split

**Decision:** Backend on Render free tier, frontend on Netlify free tier.

**Reason:** Render supports Python/FastAPI natively. Netlify is the standard for static React apps. Both have sufficient free tiers for portfolio traffic.

**Cold start handling:** Frontend pings /health on page load to warm the Render instance. If response takes >2s, a "Warming up..." banner is shown. Run Simulation button is disabled until backend is ready.

**Alternatives considered:** Railway, Fly.io for backend

**Revisit if:** Render free tier performance is unacceptable for demo scenarios.

---

## 2026-04-02 — LiteLLM requires provider-prefixed model string for CrewAI

**Decision:** In crew.py, the model is specified as `anthropic/claude-haiku-4-5-20251001`, not `claude-haiku-4-5-20251001`.

**Reason:** LiteLLM (used by CrewAI internally) requires the provider prefix to route correctly. Without it, LiteLLM raises `LLM Provider NOT provided`. Direct Anthropic SDK calls (intent_detector, debate, steer, summary_generator) are unaffected — they use the bare model name.

**Alternatives considered:** Setting ANTHROPIC_API_KEY as a global env var for LiteLLM auto-detection

**Revisit if:** CrewAI changes its LiteLLM integration in a future version.

---

## 2026-04-03 — Model updated to claude-haiku-4-5-20251001

**Decision:** All API calls use `claude-haiku-4-5-20251001` instead of the originally specified `claude-haiku-20240307`.

**Reason:** The Anthropic account only has access to models from the Claude 3.5/4.x generation. `claude-3-haiku-20240307` and `claude-haiku-20240307` both returned 404. `claude-haiku-4-5-20251001` is the latest Haiku model and works with the account.

**Alternatives considered:** claude-3-5-haiku-20241022 (deprecated, also 404)

**Revisit if:** Never — this is a newer, better model at comparable cost.
