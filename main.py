import anthropic
import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic()

SYSTEM_PROMPT = """You are a senior software engineer specializing in code review.
You analyze code for bugs, security issues, and improvements.
You never ask clarifying questions — always analyze whatever code is provided.

You MUST respond with valid JSON only. No prose. No markdown. No backticks.

Use exactly this schema:
{
  "issues": [
    {
      "line": <int or null if unknown>,
      "severity": "<low|medium|high>",
      "description": "<what the problem is and why it matters>"
    }
  ],
  "suggestions": ["<actionable improvement>"],
  "overall_score": <int 1-10>,
  "summary": "<2-3 sentence plain English overview of the code quality>"
}

If there are no issues, return "issues": [].
Never omit a key. If data is unavailable, use null."""


class AnalyzeRequest(BaseModel):
    code: str
    language: str = "python"


@app.post("/analyze")
async def analyze_code(request: AnalyzeRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="No code provided")

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            temperature=0.1,
            system=[{
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"}
            }],
            messages=[
                {
                    "role": "user",
                    "content": f"Review this {request.language} code:\n\n<code>\n{request.code}\n</code>"
                }
            ]
        )

        raw = message.content[0].text
        result = json.loads(raw)
        return result

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500, detail="Model returned invalid JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}


class BatchRequest(BaseModel):
    # [{"label": "file.py", "code": "...", "language": "python"}]
    snippets: list[dict]


@app.post("/analyze-batch")
async def analyze_batch(request: BatchRequest):
    if not request.snippets:
        raise HTTPException(status_code=400, detail="No snippets provided")
    if len(request.snippets) > 10:
        raise HTTPException(
            status_code=400, detail="Max 10 snippets per batch")

    results = []
    total_score = 0
    total_issues = 0

    for snippet in request.snippets:
        try:
            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                temperature=0.1,
                system=[{
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"}
                }],
                messages=[{
                    "role": "user",
                    "content": f"Review this {snippet.get('language', 'python')} code:\n\n<code>\n{snippet['code']}\n</code>"
                }]
            )
            result = json.loads(message.content[0].text)
            result["label"] = snippet.get("label", "untitled")
            results.append(result)
            total_score += result.get("overall_score", 0)
            total_issues += len(result.get("issues", []))
        except Exception as e:
            results.append({
                "label": snippet.get("label", "untitled"),
                "error": str(e),
                "issues": [],
                "suggestions": [],
                "overall_score": 0,
                "summary": "Analysis failed."
            })

    return {
        "results": results,
        "summary": {
            "total_snippets": len(request.snippets),
            "total_issues": total_issues,
            "average_score": round(total_score / len(results), 1) if results else 0,
            "highest_risk": min(results, key=lambda x: x["overall_score"])["label"] if results else None
        }
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
