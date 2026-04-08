"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnalysisResult } from "@/lib/types";
import ScoreGauge from "@/components/ScoreGauge";
import TierRoast from "@/components/TierRoast";
import ArtistGrid from "@/components/ArtistGrid";
import ShareButton from "@/components/ShareButton";
import LoadingState from "@/components/LoadingState";

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "lookup";
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      if (mode === "lookup") {
        // Read from sessionStorage (set by landing page)
        const stored = sessionStorage.getItem("auditest_result");
        if (stored) {
          setResult(JSON.parse(stored));
          setLoading(false);
          return;
        }
        setError("No results found. Go back and try again.");
        setLoading(false);
      } else if (mode === "full") {
        // Fetch from API (authenticated mode)
        try {
          const res = await fetch("/api/analyze");
          if (!res.ok) {
            const data = await res.json();
            setError(data.error || "Analysis failed.");
            setLoading(false);
            return;
          }
          const data = await res.json();
          setResult(data);
        } catch {
          setError("Failed to analyze. Try again.");
        }
        setLoading(false);
      }
    }
    loadResults();
  }, [mode]);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-danger text-lg">{error}</p>
        <a
          href="/"
          className="text-accent hover:underline"
        >
          try again
        </a>
      </main>
    );
  }

  if (!result) return null;

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12">
      <div className="max-w-lg w-full space-y-8">
        {/* Score */}
        <ScoreGauge percentage={result.percentage} tier={result.tier} />

        {/* Roast */}
        <TierRoast roast={result.roast} />

        {/* Stats summary */}
        <div
          className="flex justify-center gap-6 text-sm text-text-muted animate-slide-up"
          style={{ animationDelay: "0.5s", opacity: 0 }}
        >
          <span>
            <strong className="text-female">{result.femaleCount}</strong> women
          </span>
          <span>
            <strong className="text-male">{result.maleCount}</strong> men
          </span>
          <span>
            <strong className="text-unknown">{result.unknownCount}</strong>{" "}
            unknown
          </span>
        </div>

        {/* Mode-specific stats */}
        {result.mode === "full" && result.stats && (
          <p
            className="text-center text-xs text-text-muted/60 animate-slide-up"
            style={{ animationDelay: "0.5s", opacity: 0 }}
          >
            scanned {result.artists.length} unique artists from your library
          </p>
        )}
        {result.mode === "lookup" && result.stats?.playlistCount && (
          <p
            className="text-center text-xs text-text-muted/60 animate-slide-up"
            style={{ animationDelay: "0.5s", opacity: 0 }}
          >
            based on {result.stats.playlistCount} public playlists
          </p>
        )}

        {/* Artist breakdown */}
        <ArtistGrid artists={result.artists} />

        {/* Actions */}
        <div
          className="flex flex-col items-center gap-4 pt-4 animate-slide-up"
          style={{ animationDelay: "0.9s", opacity: 0 }}
        >
          <ShareButton percentage={result.percentage} tier={result.tier} />
          <a href="/" className="text-text-muted text-sm hover:text-accent transition-colors">
            audit someone else
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-text-muted/40 text-xs pt-8">
          gender data from wikidata. bands &amp; unclassified artists excluded
          from score.
        </p>
      </div>
    </main>
  );
}
