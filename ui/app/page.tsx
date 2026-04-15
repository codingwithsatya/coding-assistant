"use client";
import { useState } from "react";

interface Issue {
  line: number | null;
  severity: "low" | "medium" | "high";
  description: string;
}

interface AnalysisResult {
  issues: Issue[];
  suggestions: string[];
  overall_score: number;
  summary: string;
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

export default function Home() {
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
      const res = await fetch(
        "https://coding-assistant-production.up.railway.app/analyze",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, language }),
        },
      );

      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError("Could not reach the backend. Is uvicorn running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            AI Code Reviewer
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Paste any code snippet and get instant feedback
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — Input */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full h-96 font-mono text-sm p-4 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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

          {/* Right — Results */}
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

            {result && (
              <>
                {/* Score + Summary */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Quality Score
                    </span>
                    <span
                      className={`text-3xl font-bold ${SCORE_COLOR(result.overall_score)}`}
                    >
                      {result.overall_score}
                      <span className="text-base font-normal text-gray-400">
                        /10
                      </span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {result.summary}
                  </p>
                </div>

                {/* Issues */}
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
                              <span className="opacity-60">
                                Line {issue.line}
                              </span>
                            )}
                          </div>
                          <p className="leading-relaxed">{issue.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
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
                          <span className="text-blue-400 mt-0.5 flex-shrink-0">
                            →
                          </span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
