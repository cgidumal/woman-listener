"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
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

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      const result = await res.json();
      sessionStorage.setItem("auditest_result", JSON.stringify(result));
      router.push("/results?mode=lookup");
    } catch {
      setError("Failed to connect. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            do you even listen to{" "}
            <span className="text-accent">women</span>?
          </h1>
          <p className="text-text-muted text-lg">
            paste a spotify profile. we&apos;ll check the receipts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="open.spotify.com/user/..."
            className="w-full bg-surface border border-surface-light rounded-xl px-5 py-4 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors text-base"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full bg-accent hover:bg-accent/90 disabled:bg-surface-light disabled:text-text-muted text-white font-semibold rounded-xl px-5 py-4 transition-all text-base cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-pulse-slow">analyzing...</span>
            ) : (
              "audit them"
            )}
          </button>
          {error && <p className="text-danger text-sm">{error}</p>}
        </form>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-surface-light" />
          <span className="text-text-muted text-sm">or</span>
          <div className="flex-1 h-px bg-surface-light" />
        </div>

        <a
          href="/api/auth/login"
          className="inline-flex items-center gap-3 bg-spotify hover:bg-spotify/90 text-white font-semibold rounded-xl px-6 py-4 transition-all text-base"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          audit yourself (deep scan)
        </a>

        <p className="text-text-muted/60 text-xs max-w-sm mx-auto">
          we only read public playlist data (or your library if you connect).
          we don&apos;t store anything. ever.
        </p>
      </div>
    </main>
  );
}
