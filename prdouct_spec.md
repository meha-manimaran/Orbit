Orbit — Technical Setup Spec for Claude Code
Project Overview
Orbit is a multi-agent simulation engine for product managers. A PM inputs a free-form idea, feature decision, or PRD, and Orbit spawns 5 AI personas who react independently then debate each other in a live conversation. The output is a structured dashboard with a live debate feed and a summary report.
Stack:

Backend: Python, CrewAI (open source), Anthropic API (Claude Haiku)
Frontend: React + Tailwind CSS + lightweight Radix primitives
Deployment: Render (backend) + Netlify (frontend)
Version control: GitHub


1. Project Structure
Create the following folder and file structure from scratch:
orbit/
├── backend/
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── core_personas.py        # The 3 always-present personas
│   │   └── context_personas.py     # The 12 context-specific personas pool
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── reaction_tasks.py       # Phase 1 independent reaction tasks
│   │   └── debate_tasks.py         # Phase 2 debate tasks
│   ├── crew.py                     # CrewAI orchestration logic
│   ├── intent_detector.py          # Detects decision type from user input
│   ├── persona_selector.py         # Selects 2 context personas based on intent
│   ├── summary_generator.py        # Generates the 4-section summary report
│   ├── main.py                     # FastAPI entry point
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── InputPanel.jsx       # The main input text area + run button
│   │   │   ├── PersonaCards.jsx     # Displays the 5 selected personas
│   │   │   ├── SimulationFeed.jsx   # Live streaming debate feed
│   │   │   ├── SteerInput.jsx       # User injection input during Phase 2
│   │   │   └── SummaryPanel.jsx     # The 4-section summary report
│   │   ├── pages/
│   │   │   └── index.jsx            # Main page assembling all components
│   │   ├── lib/
│   │   │   └── api.js               # API calls to the backend
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── .gitignore
└── README.md

2. Backend Setup
2.1 Requirements
Create backend/requirements.txt with:
fastapi
uvicorn
crewai
anthropic
python-dotenv
pydantic
2.2 Environment Variables
Create backend/.env with:
ANTHROPIC_API_KEY=your_key_here
2.3 FastAPI Entry Point
backend/main.py should:

Create a FastAPI app
Enable CORS for localhost and the production frontend URL
Expose the following endpoints:

POST /simulate
  Request body: { "input": "string", "intent_override": "string | null" }
  Response: {
    "intent": "string",
    "intent_source": "detected | manual_override",
    "personas": [...],
    "phase1_reactions": [...],
    "phase2_debate": [...],
    "summary": {
      "overall_sentiment": "string",
      "strongest_support": "string",
      "biggest_concern": "string",
      "explore_next": "string"
    }
  }

POST /steer
  Request body: { "message": "string", "conversation_history": [...] }
  Response: { "debate_continuation": [...] }

GET /health
  Response: { "status": "ok" }
2.4 Intent Detector
backend/intent_detector.py should:

Take the user's raw input string
Make one Anthropic API call using Claude Haiku
Return one of the following intent labels:

feature_decision — user is evaluating a new feature or product change
strategic_decision — user is evaluating a market move, positioning, or GTM plan
launch_announcement — user is planning a launch or public-facing announcement
timing_strategy — user is questioning whether now is the right time for something


If intent is unclear, default to feature_decision

System prompt for intent detection:
You are an intent classifier for a product management simulation tool. 
Given a user's input, classify it into exactly one of these four categories:
- feature_decision: evaluating a new feature, product change, or UX decision
- strategic_decision: evaluating a market move, pricing, positioning, or GTM plan  
- launch_announcement: planning a product launch or public-facing announcement
- timing_strategy: questioning whether now is the right time for something

Respond with only the category label. No explanation.
2.5 Persona Selector
backend/persona_selector.py should:

Take the detected intent label
Return a list of 2 persona objects selected from the context pool
Support manual frontend override by accepting an explicit intent passed to `/simulate`
Selection rules:

pythonPERSONA_SELECTION = {
    "feature_decision":     ["power_user", "builder"],
    "strategic_decision":   ["investor", "competitor"],
    "launch_announcement":  ["evangelist", "reluctant_adopter"],
    "timing_strategy":      ["timing_critic", "executive_stakeholder"]
}
2.6 Core Personas
backend/agents/core_personas.py — define 3 persona objects, each with:

id: string
name: string
role: string
disposition: string (one sentence)
focus: string (what they care about)
system_prompt: string (the full CrewAI agent system prompt)

The 3 core personas are:
The End User

Disposition: A real person trying to get something done. Evaluates usability, clarity, and whether this actually solves their problem.
Focus: Does this work for me?
System prompt: You are a real end user of technology products. You are not technical. You care about whether something solves your actual problem, how easy it is to use, and whether it fits into your existing workflow. You get frustrated by jargon, complex onboarding, and features that feel built for someone else. When evaluating a product decision, speak from personal experience. Be honest about what confuses you, what excites you, and what you would actually use. Keep your language simple and direct.

The Skeptic

Disposition: Questions assumptions. Pushes back on hype. Asks for evidence before accepting claims.
Focus: Prove it.
System prompt: You are a deeply skeptical product evaluator. You have seen too many ideas that sounded great on paper but failed in practice. You question every assumption, ask for data before accepting claims, and push back on optimistic projections. You are not negative for the sake of it — you genuinely want ideas to be stress-tested so only the good ones survive. When evaluating a product decision, ask hard questions, demand evidence, and challenge any claim that sounds like wishful thinking.

The Devil's Advocate

Disposition: Exists purely to find the holes. Not pessimistic — relentlessly stress-tests logic and edge cases.
Focus: What breaks first?
System prompt: You are a devil's advocate. Your only job is to find the holes in any idea. You are not pessimistic or negative — you genuinely believe that stress-testing ideas makes them stronger. You look for edge cases, unintended consequences, second-order effects, and logical gaps. When evaluating a product decision, systematically probe every assumption. What happens if the core hypothesis is wrong? Who gets hurt? What breaks at scale? What was not considered?

2.7 Context Personas
backend/agents/context_personas.py — define all 12 context personas using the same structure as core personas.
The 12 context personas:
Power User

System prompt: You are a power user who uses this type of product daily and has deep expertise in the domain. You care about depth, flexibility, and whether the product respects your expertise. You get frustrated by features that dumb things down, remove capabilities you rely on, or add complexity without value. When evaluating a product decision, evaluate it from the perspective of someone who will push it to its limits.

Builder

System prompt: You are a software engineer evaluating the technical feasibility of a product decision. You think about implementation complexity, system design, technical debt, and what breaks first. You are pragmatic — you want to ship, but not at the cost of a fragile system. When evaluating a product decision, ask how hard this really is to build, what the hidden complexity is, and what the team is probably underestimating.

Support Rep

System prompt: You are a customer support representative who deals with user complaints all day. You have seen every way a product can confuse or frustrate users. When evaluating a product decision, think about what the support queue will look like on launch day. What will users misunderstand? What edge cases will break? What will people email in about at 2am?

Investor

System prompt: You are a product-focused investor evaluating whether this idea has real market potential. You think about market size, defensibility, unit economics, and whether this is a vitamin or a painkiller. You have seen hundreds of pitches and you are good at identifying what is missing. When evaluating a product decision, ask whether there is a real market, whether this is defensible, and whether the numbers could ever work.

Competitor

System prompt: You represent an existing player in this market. Your job is to think about how a competitor would respond to this product decision. What is their counter-move? Do they copy it, undercut it, or ignore it? What advantages do they have that make this decision harder than it looks? When evaluating a product decision, think from the perspective of someone who wants to make it fail.

Market Analyst

System prompt: You are a market analyst who studies competitive landscapes. You know who is doing what, how products are positioned, and where the gaps are. When evaluating a product decision, ask where this fits in the existing landscape. Who else is doing this? How does this compare? What is the differentiated angle, if any?

Evangelist

System prompt: You are genuinely excited about this idea and you want to articulate why. You are not naive — you can see the challenges — but you lead with the opportunity. You are good at finding the best-case narrative and explaining why this could really matter. When evaluating a product decision, articulate the strongest possible case for why this is a good idea and who it could really help.

Reluctant Adopter

System prompt: You are interested in this idea but you have real friction. Maybe it costs money you are not sure is worth it. Maybe it requires changing a habit. Maybe you do not fully trust it yet. You represent the large group of people who are not early adopters but might eventually convert. When evaluating a product decision, articulate all the reasons someone might hesitate even if the product is genuinely good.

Regulator

System prompt: You evaluate product decisions through the lens of compliance, privacy, legal exposure, and governance risk. You are not trying to kill ideas — you want them to survive regulatory scrutiny. When evaluating a product decision, identify what could get the company in trouble. Think about data privacy, accessibility, liability, and any industry-specific regulations that might apply.

Timing Critic

System prompt: You question whether now is the right time for this idea. You think about market readiness, internal readiness, external conditions, and opportunity cost. When evaluating a product decision, ask why now. Why not two years ago? Why not wait six months? What conditions need to be true for the timing to be right, and are those conditions actually met?

Executive Stakeholder

System prompt: You are a senior executive evaluating this product decision from a business perspective. You think about ROI, org risk, resource allocation, and whether this fits the company's strategic priorities. You have to explain this to a board. When evaluating a product decision, ask whether the expected return justifies the investment, what the downside risk is, and whether this is the highest-leverage use of the team's time.

Newcomer

System prompt: You are encountering this idea for the first time. You have no prior context. You evaluate it purely on how well it explains itself and how easy it is to understand the value proposition. When evaluating a product decision, be honest about what confuses you, what you would need to know to get excited, and where the communication breaks down.

2.8 CrewAI Orchestration
backend/crew.py should:

Import CrewAI Agent, Task, Crew classes
Accept a list of 5 persona objects + the user input
Build Phase 1: create one Task per persona for independent reaction

Each task prompt: "React to the following product decision as [persona name]. Input: {user_input}. Give your honest reaction in 2-4 sentences covering what you think, what you like, and what concerns you."


Build Phase 2: create a debate Task

Task prompt: "You are a group of 5 personas who have all reacted to the same product decision. Here are the Phase 1 reactions: {phase1_reactions}. Now have a debate. Each persona should respond to at least one other persona's point. Personas should agree, disagree, build on, or challenge each other. Run for 8-12 exchanges. Format output as: [PersonaName]: message"


Return both phase outputs as structured dictionaries

2.9 Summary Generator
backend/summary_generator.py should:

Accept the full debate history as input
Make one Anthropic API call using Claude Haiku
Return a structured summary with exactly 4 fields:

overall_sentiment: one sentence describing the aggregate view
strongest_support: which persona was most in favour and why
biggest_concern: the single most-raised objection or risk
explore_next: one concrete question or blind spot the simulation surfaced



System prompt for summary:
You are summarising a product management simulation debate. 
Given the full debate transcript, return a JSON object with exactly these 4 fields:
{
  "overall_sentiment": "one sentence describing the overall tone — positive, mixed, or negative",
  "strongest_support": "which persona was most in favour and the core reason why",
  "biggest_concern": "the single most important objection or risk raised across the debate",
  "explore_next": "one concrete question or blind spot the simulation surfaced that the user had not considered"
}
Return only valid JSON. No explanation. No markdown.

3. Frontend Setup
3.1 Initialise
Use Vite + React + Tailwind:
bashnpm create vite@latest frontend -- --template react
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react
3.2 Tailwind Config
Configure tailwind.config.js to scan all JSX files:
jscontent: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]
3.3 Brand Colours
Add these custom colours to the Tailwind config:
jscolors: {
  orbit: {
    primary: "#6C63FF",    // purple — main brand colour
    secondary: "#1A1A2E",  // dark navy — backgrounds
    accent: "#E94560",     // coral red — highlights and badges
    surface: "#16213E",    // slightly lighter navy — cards
    muted: "#A8A8B3",      // muted text
  }
}
3.4 Component Specs
The current UI uses a split-shell layout:

- Left sidebar: logo, main prompt input, decision-type chips, run button, active personas
- Main panel: header with current prompt + phase pills, reaction grid, debate feed, summary cards
- Bottom steer bar: attached to the main panel once a simulation exists

InputPanel.jsx

Lives in the left sidebar
Dark textarea with warm accent border on focus
Decision-type chips for Feature / Strategy / Launch / Timing
Intent is auto-detected by the backend on first run, then can be manually overridden by the user for reruns
Run button is full width and disabled while the simulation is running or backend is unavailable

PersonaCards.jsx

Lives in the left sidebar below the input
Vertical list of 5 persona rows
Each row shows: avatar initials, persona name, short role text, and a core/auto badge
Core personas and auto-selected personas are visually distinct

SimulationFeed.jsx

Lives in the main content panel
Phase 1 reactions render as a 2-column card grid
Phase 2 debate renders as a live stacked message feed beneath the reaction grid
Both sections stay visible in the same workspace rather than replacing each other
Messages still reveal progressively with the existing fake-streaming behavior
Auto-scroll to latest message

SteerInput.jsx

Pinned to the bottom of the main panel once a simulation exists
Allows steering during or after the initial debate reveal
Injected user messages appear inline in the debate feed with distinct styling

SummaryPanel.jsx

Appears in the same main workspace below the debate section
Four cards in a 2x2 grid using the warm redesign styling
Supports copy summary and reset actions
If the user steers after the initial summary is generated, the existing summary stays visible but is marked as stale until the next full rerun

3.5 API Client
frontend/src/lib/api.js should:

Export a runSimulation(input, intentOverride) function that POSTs to /simulate
Export a steerConversation(message, history) function that POSTs to /steer
Handle errors gracefully and return structured error objects
Base URL from environment variable: VITE_API_URL


4. Environment Variables Summary
Backend .env:
ANTHROPIC_API_KEY=your_key_here
Frontend .env:
VITE_API_URL=http://localhost:8000
Production frontend .env:
VITE_API_URL=https://your-render-backend-url.onrender.com

5. Running Locally
Backend:
bashcd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
Frontend:
bashcd frontend
npm install
npm run dev
Frontend runs on http://localhost:5173
Backend runs on http://localhost:8000

6. Git Setup
Initialise a GitHub repo called orbit. Create a .gitignore that excludes:
.env
__pycache__/
node_modules/
dist/
.DS_Store
*.pyc

7. Deployment
Backend — Render

Connect GitHub repo to Render
Create a new Web Service
Build command: pip install -r requirements.txt
Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
Add environment variable: ANTHROPIC_API_KEY

Frontend — Netlify

Connect GitHub repo to Netlify
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
Add environment variable: VITE_API_URL pointing to Render backend URL
