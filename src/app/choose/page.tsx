"use client";

import { useState } from "react";

export default function ChoosePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("auditest_result", JSON.stringify(data));
      window.location.href = "/results?mode=lookup";
    } catch {
      setError("Failed to connect. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            who are we auditing?
          </h1>
          <p className="text-text-muted">
            you&apos;re connected. now pick your target.
          </p>
        </div>

        <a
          href="/results?mode=full"
          className="block w-full bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl px-6 py-5 transition-all text-lg text-center"
        >
          audit me
        </a>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-surface-light" />
          <span className="text-text-muted text-sm">or creep on someone</span>
          <div className="flex-1 h-px bg-surface-light" />
        </div>

        <form onSubmit={handleLookup} className="space-y-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="paste their spotify profile URL..."
            className="w-full bg-surface border border-surface-light rounded-xl px-5 py-4 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors text-base"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full bg-surface-light hover:bg-surface text-text font-semibold rounded-xl px-5 py-4 transition-all text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-pulse-slow">analyzing...</span>
            ) : (
              "audit them"
            )}
          </button>
          {error && <p className="text-danger text-sm">{error}</p>}
        </form>
      </div>
    </main>
  );
}
