# Orbit

Multi-agent simulation engine for product managers.

## Stack

- **Backend:** Python, FastAPI, CrewAI, Anthropic API (Claude Haiku)
- **Frontend:** React + Vite + Tailwind CSS + Radix UI
- **Deployment:** Render (backend) + Netlify (frontend)

## Running Locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:8000
