"use client";

import { useEffect, useState } from "react";
import { AnalysisResult } from "@/lib/types";
import ScoreGauge from "@/components/ScoreGauge";
import TierRoast from "@/components/TierRoast";
import ArtistGrid from "@/components/ArtistGrid";
import ShareButton from "@/components/ShareButton";
import LoadingState from "@/components/LoadingState";

export default function ResultsPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode") || "lookup";

    if (mode === "lookup") {
      const stored = sessionStorage.getItem("auditest_result");
      if (stored) {
        setResult(JSON.parse(stored));
      } else {
        setError("No results found. Go back and try again.");
      }
      setLoading(false);
    } else if (mode === "full") {
      fetch("/api/analyze")
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setResult(data);
          }
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to analyze. Try again.");
          setLoading(false);
        });
    }
  }, []);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-danger text-lg">{error}</p>
        <a href="/" className="text-accent hover:underline">
          try again
        </a>
      </main>
    );
  }

  if (!result) return null;

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12">
      <div className="max-w-lg w-full space-y-8">
        <ScoreGauge percentage={result.weightedPercentage} tier={result.tier} />
        <TierRoast roast={result.roast} />

        <div className="flex justify-center gap-6 text-sm text-text-muted animate-slide-up"
          style={{ animationDelay: "0.5s", opacity: 0 }}>
          <span><strong className="text-female">{result.femaleCount}</strong> non-men</span>
          <span><strong className="text-male">{result.maleCount}</strong> men</span>
          {result.unknownCount > 0 && (
            <span><strong className="text-unknown">{result.unknownCount}</strong> unknown</span>
          )}
        </div>

        {result.weightedPercentage !== result.percentage && (
          <p className="text-center text-xs text-text-muted/60 animate-slide-up"
            style={{ animationDelay: "0.5s", opacity: 0 }}>
            {result.percentage}% by artist count &middot; {result.weightedPercentage}% weighted by how much you listen
          </p>
        )}

        {result.mode === "full" && (
          <p className="text-center text-xs text-text-muted/60 animate-slide-up"
            style={{ animationDelay: "0.5s", opacity: 0 }}>
            scanned {result.artists.length} unique artists from your library
          </p>
        )}

        <ArtistGrid artists={result.artists} />

        <div className="flex flex-col items-center gap-4 pt-4 animate-slide-up"
          style={{ animationDelay: "0.9s", opacity: 0 }}>
          <ShareButton percentage={result.percentage} tier={result.tier} />
          <a href="/api/auth/logout" className="text-text-muted text-sm hover:text-accent transition-colors">
            log out &amp; try someone else
          </a>
        </div>

        <p className="text-center text-text-muted/40 text-xs pt-8">
          gender data from wikidata. bands &amp; unclassified artists excluded from score.
        </p>
      </div>
    </main>
  );
}
