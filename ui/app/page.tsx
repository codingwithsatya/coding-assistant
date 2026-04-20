"use client";
import { useState } from "react";

interface Issue {
  line: number | null;
  severity: "low" | "medium" | "high";
  description: string;
}

interface AnalysisResult {
  label?: string;
  issues: Issue[];
  suggestions: string[];
  overall_score: number;
  summary: string;
  error?: string;
}

interface BatchSummary {
  total_snippets: number;
  total_issues: number;
  average_score: number;
  highest_risk: string | null;
}

interface BatchResult {
  results: AnalysisResult[];
  summary: BatchSummary;
}

const SEVERITY_STYLES = {
  high: "bg-red-50 border-red-200 text-red-800",
  medium: "bg-amber-50 border-amber-200 text-amber-800",
  low: "bg-blue-50 border-blue-200 text-blue-800",
};

const SCORE_COLOR = (score: number) => {
  if (score >= 8) return "text-green-600";
  if (score >= 5) return "text-amber-600";
  return "text-red-600";
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Single Analyzer ──────────────────────────────────────────────
function SingleAnalyzer() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      setResult(await res.json());
    } catch {
      setError("Could not reach the backend. Is uvicorn running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="python">Python</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
          </select>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your code here..."
          className="w-full h-96 font-mono text-sm p-4 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          onClick={analyze}
          disabled={loading || !code.trim()}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Analyzing..." : "Analyze Code"}
        </button>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {!result && !loading && (
          <div className="h-96 flex items-center justify-center border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
            Analysis results will appear here
          </div>
        )}
        {loading && (
          <div className="h-96 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 text-sm">
            Reviewing your code...
          </div>
        )}
        {result && <ResultCard result={result} />}
      </div>
    </div>
  );
}

// ── Batch Analyzer ───────────────────────────────────────────────
function BatchAnalyzer() {
  const [snippets, setSnippets] = useState([
    { label: "", code: "", language: "python" },
    { label: "", code: "", language: "python" },
  ]);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateSnippet = (i: number, field: string, value: string) => {
    setSnippets((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    );
  };

  const addSnippet = () => {
    if (snippets.length < 10)
      setSnippets((prev) => [
        ...prev,
        { label: "", code: "", language: "python" },
      ]);
  };

  const removeSnippet = (i: number) => {
    if (snippets.length > 1)
      setSnippets((prev) => prev.filter((_, idx) => idx !== i));
  };

  const analyze = async () => {
    const valid = snippets.filter((s) => s.code.trim());
    if (!valid.length) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API}/analyze-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snippets: valid.map((s, i) => ({
            ...s,
            label: s.label || `snippet-${i + 1}`,
          })),
        }),
      });
      if (!res.ok) throw new Error("Batch analysis failed");
      setResult(await res.json());
    } catch {
      setError("Could not reach the backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Inputs */}
      <div className="flex flex-col gap-4">
        {snippets.map((s, i) => (
          <div
            key={i}
            className="bg-white border border-gray-300 rounded-xl p-4 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <input
                value={s.label}
                onChange={(e) => updateSnippet(i, "label", e.target.value)}
                placeholder={`File name (e.g. utils.py)`}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={s.language}
                onChange={(e) => updateSnippet(i, "language", e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="python">Python</option>
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>
              {snippets.length > 1 && (
                <button
                  onClick={() => removeSnippet(i)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
            <textarea
              value={s.code}
              onChange={(e) => updateSnippet(i, "code", e.target.value)}
              placeholder="Paste code here..."
              className="w-full h-32 font-mono text-sm p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        ))}
        <div className="flex gap-3">
          {snippets.length < 10 && (
            <button
              onClick={addSnippet}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              + Add snippet
            </button>
          )}
          <button
            onClick={analyze}
            disabled={loading || !snippets.some((s) => s.code.trim())}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? `Analyzing ${snippets.filter((s) => s.code.trim()).length} snippets...`
              : "Analyze All"}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-4">
          {/* Batch summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {result.summary.total_snippets}
              </div>
              <div className="text-xs text-gray-500 mt-1">Files analyzed</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div
                className={`text-2xl font-bold ${SCORE_COLOR(result.summary.average_score)}`}
              >
                {result.summary.average_score}
              </div>
              <div className="text-xs text-gray-500 mt-1">Avg score</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {result.summary.total_issues}
              </div>
              <div className="text-xs text-gray-500 mt-1">Total issues</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-sm font-bold text-amber-600 truncate">
                {result.summary.highest_risk || "—"}
              </div>
              <div className="text-xs text-gray-500 mt-1">Highest risk</div>
            </div>
          </div>
          {/* Individual results */}
          {result.results.map((r, i) => (
            <div key={i}>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                {r.label}
              </div>
              <ResultCard result={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared Result Card ───────────────────────────────────────────
function ResultCard({ result }: { result: AnalysisResult }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Quality Score
          </span>
          <span
            className={`text-3xl font-bold ${SCORE_COLOR(result.overall_score)}`}
          >
            {result.overall_score}
            <span className="text-base font-normal text-gray-400">/10</span>
          </span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {result.summary}
        </p>
      </div>
      {result.issues.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Issues{" "}
            <span className="text-gray-400 font-normal">
              ({result.issues.length})
            </span>
          </h2>
          <div className="flex flex-col gap-2">
            {result.issues.map((issue, i) => (
              <div
                key={i}
                className={`text-xs border rounded-lg px-3 py-2.5 ${SEVERITY_STYLES[issue.severity]}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold uppercase tracking-wide">
                    {issue.severity}
                  </span>
                  {issue.line && (
                    <span className="opacity-60">Line {issue.line}</span>
                  )}
                </div>
                <p className="leading-relaxed">{issue.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {result.suggestions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Suggestions
          </h2>
          <ul className="flex flex-col gap-2">
            {result.suggestions.map((s, i) => (
              <li
                key={i}
                className="text-xs text-gray-600 flex gap-2 leading-relaxed"
              >
                <span className="text-blue-400 mt-0.5 flex-shrink-0">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function Home() {
  const [tab, setTab] = useState<"single" | "batch">("single");

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            AI Code Reviewer
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Paste any code snippet and get instant feedback
          </p>
        </div>
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setTab("single")}
            className={`px-5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === "single" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Single file
          </button>
          <button
            onClick={() => setTab("batch")}
            className={`px-5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === "batch" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Batch
          </button>
        </div>
        {tab === "single" ? <SingleAnalyzer /> : <BatchAnalyzer />}
      </div>
    </main>
  );
}
