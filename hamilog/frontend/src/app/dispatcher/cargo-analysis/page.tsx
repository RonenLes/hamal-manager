"use client";

import { useState } from "react";
import { analyzeCargo } from "@/lib/api-client";
import BackToMenuButton from "@/components/shared/BackToMenuButton";

type CargoResult = {
  source: string;
  cargo: {
    volume_liters: number;
    weight_kg: number;
    requires_cooling: boolean;
  };
  raw_response?: string;
  note?: string;
};

// Renders the cargo analysis page component.
export default function CargoAnalysisPage() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CargoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handles the analyze action.
  async function handleAnalyze() {
    if (!description.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeCargo(description.trim());
      setResult(data as CargoResult);
    } catch {
      setError("Failed to analyze cargo. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-3xl">
        <BackToMenuButton href="/dispatcher/menu" />

        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            AI-Powered Tool
          </p>
          <h1 className="mt-1 text-3xl font-black">AI Cargo Analysis</h1>
          <p className="mt-2 text-muted">
            Describe the cargo in natural language and the AI will estimate
            volume, weight, and cooling requirements.
          </p>
        </header>

        {/* Input */}
        <section className="rounded-2xl border border-app bg-card p-6 shadow-xl">
          <label
            htmlFor="cargo-description"
            className="mb-2 block text-sm font-bold text-main"
          >
            Cargo Description
          </label>
          <textarea
            id="cargo-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="e.g. 50 kg of frozen vaccines in insulated boxes, about 30 liters total"
            className="w-full resize-none rounded-xl border border-app bg-input px-4 py-3 text-sm text-main placeholder:text-soft outline-none focus:border-blue-500 transition"
          />

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !description.trim()}
            className="btn-primary mt-4 flex items-center justify-center gap-2 text-sm"
            id="analyze-cargo-btn"
          >
            {loading ? (
              <>
                <span
                  className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                  style={{ animation: "spin-slow 0.7s linear infinite" }}
                />
                Analyzing…
              </>
            ) : (
              "🤖 Analyze Cargo"
            )}
          </button>
        </section>

        {/* Error */}
        {error && (
          <div
            className="mt-5 rounded-2xl border px-5 py-4 text-sm"
            style={{
              background: "rgba(244,63,94,0.1)",
              borderColor: "rgba(244,63,94,0.25)",
              color: "var(--accent-rose)",
            }}
          >
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <section className="mt-6 space-y-5 animate-fade-up">
            <div className="rounded-2xl border border-app bg-card p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-black text-main">
                Analysis Result
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Weight */}
                <div className="rounded-xl border border-app bg-card-soft p-4 text-center">
                  <div className="text-3xl font-black text-blue-400">
                    {result.cargo.weight_kg}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">
                    Weight (kg)
                  </div>
                </div>

                {/* Volume */}
                <div className="rounded-xl border border-app bg-card-soft p-4 text-center">
                  <div className="text-3xl font-black text-cyan-400">
                    {result.cargo.volume_liters}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">
                    Volume (L)
                  </div>
                </div>

                {/* Cooling */}
                <div className="rounded-xl border border-app bg-card-soft p-4 text-center">
                  <div
                    className={`text-3xl font-black ${
                      result.cargo.requires_cooling
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {result.cargo.requires_cooling ? "Yes" : "No"}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">
                    Cooling Required
                  </div>
                </div>
              </div>

              {/* Source badge */}
              <div className="mt-5 flex items-center gap-2">
                <span className="text-xs text-muted">Analyzed by:</span>
                <span
                  className="badge"
                  style={{
                    background:
                      result.source === "openai"
                        ? "rgba(16,185,129,0.12)"
                        : "rgba(59,130,246,0.12)",
                    color:
                      result.source === "openai"
                        ? "var(--accent-emerald)"
                        : "var(--accent-blue)",
                    border: `1px solid ${
                      result.source === "openai"
                        ? "rgba(16,185,129,0.25)"
                        : "rgba(59,130,246,0.25)"
                    }`,
                  }}
                >
                  {result.source === "openai" ? "OpenAI GPT" : "Regex Parser"}
                </span>
              </div>

              {/* Note */}
              {result.note && (
                <p className="mt-3 text-xs text-muted italic">{result.note}</p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
