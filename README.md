# AI Code Reviewer

An AI-powered code review tool that analyzes code snippets for bugs, security issues, and improvements. Supports single file and batch analysis with structured feedback.

**🔗 Live demo:** https://coding-assistant-git-main-codingwithsatyas-projects.vercel.app

![AI Code Reviewer](https://img.shields.io/badge/Built%20with-Claude%20API-blue) ![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green) ![Next.js](https://img.shields.io/badge/Frontend-Next.js-black)

---

## Features

- **Single file analysis** — paste any code snippet and get instant structured feedback
- **Batch analysis** — analyze up to 10 files at once with a cross-file summary report
- **Severity scoring** — issues categorized as high / medium / low with line numbers
- **Quality score** — 1–10 score per file with plain English summary
- **Actionable suggestions** — specific improvements, not generic advice
- **Multi-language support** — Python, TypeScript, JavaScript, Go, Rust
- **Prompt caching** — 90% cost reduction on repeated API calls

---

## Tech Stack

| Layer      | Technology                            |
| ---------- | ------------------------------------- |
| Frontend   | Next.js 16, TypeScript, Tailwind CSS  |
| Backend    | Python, FastAPI, Uvicorn              |
| AI         | Claude API (claude-sonnet-4-6)        |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## How It Works

1. User pastes code into the frontend
2. Next.js sends a POST request to the FastAPI backend
3. Backend wraps the code in XML tags and sends to Claude with a strict JSON schema
4. Claude returns structured analysis — issues, suggestions, score, summary
5. Frontend renders severity-colored cards, score, and suggestions

**Prompt engineering patterns used:**

- Persona + Constraint + Format system prompt structure
- XML tags to separate instructions from user code
- Temperature 0.1 for near-deterministic JSON output
- Explicit null case handling to prevent missing keys

---

## Project Structure

```
coding-assistant/
├── main.py              # FastAPI backend — /analyze and /analyze-batch endpoints
├── requirements.txt     # anthropic, fastapi, uvicorn, python-dotenv
├── nixpacks.toml        # Railway deployment config
├── .env                 # ANTHROPIC_API_KEY (not committed)
└── ui/
    ├── app/
    │   └── page.tsx     # Single + batch analyzer UI with tab navigation
    └── vercel.json      # Vercel deployment config
```

---

## Running Locally

**Backend**

```bash
cd coding-assistant
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Add your API key to .env
echo "ANTHROPIC_API_KEY=your_key_here" > .env

uvicorn main:app --reload
# Runs on http://localhost:8000
```

**Frontend**

```bash
cd ui
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## API Endpoints

### `POST /analyze`

Analyze a single code snippet.

**Request**

```json
{
  "code": "def divide(a, b):\n    return a / b",
  "language": "python"
}
```

**Response**

```json
{
  "issues": [
    {
      "line": 2,
      "severity": "high",
      "description": "No division by zero check..."
    }
  ],
  "suggestions": ["Add a guard clause for b == 0..."],
  "overall_score": 3,
  "summary": "The function is extremely minimal and lacks basic robustness..."
}
```

---

### `POST /analyze-batch`

Analyze up to 10 snippets at once.

**Request**

```json
{
  "snippets": [
    { "label": "divide.py", "code": "...", "language": "python" },
    { "label": "utils.py", "code": "...", "language": "python" }
  ]
}
```

**Response**

```json
{
  "results": [...],
  "summary": {
    "total_snippets": 2,
    "total_issues": 4,
    "average_score": 5.5,
    "highest_risk": "divide.py"
  }
}
```

---

## Deployment

**Backend → Railway**

- Push to GitHub — Railway auto-deploys
- Set `ANTHROPIC_API_KEY` in Railway environment variables
- `nixpacks.toml` handles the start command

**Frontend → Vercel**

- Set Root Directory to `ui` in Vercel project settings
- Set `NEXT_PUBLIC_API_URL` to your Railway backend URL
- Auto-deploys on every push to main

---

## Built as part of a 6-month AI Engineering curriculum

This project is Week 3–4 of a structured learning path from full-stack developer to AI engineer.
Follow the journey: [@codingwithsatya](https://github.com/codingwithsatya)
