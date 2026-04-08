"use client";

import { useEffect, useState } from "react";
import { AnalysisResult } from "@/lib/types";
import ScoreGauge from "@/components/ScoreGauge";
import TierRoast from "@/components/TierRoast";
import ArtistGrid from "@/components/ArtistGrid";
import ShareButton from "@/components/ShareButton";
import LoadingState from "@/components/LoadingState";

const TIME_RANGES = [
  { key: "short_term", label: "Last 4 weeks" },
  { key: "medium_term", label: "Last 6 months" },
  { key: "long_term", label: "All time" },
] as const;

export default function ResultsPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>("long_term");

  function fetchResults(range: string) {
    setLoading(true);
    setError("");
    fetch(`/api/analyze?time_range=${range}`)
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

  useEffect(() => {
    fetchResults(timeRange);
  }, []);

  function handleTimeChange(range: string) {
    setTimeRange(range);
    fetchResults(range);
  }

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
        {/* Time range toggle */}
        <div className="flex justify-center gap-1 bg-surface rounded-xl p-1">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.key}
              onClick={() => handleTimeChange(tr.key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                timeRange === tr.key
                  ? "bg-accent text-white"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>

        <ScoreGauge percentage={result.weightedPercentage} tier={result.tier} />
        <TierRoast roast={result.roast} />

        <div className="flex justify-center gap-6 text-sm text-text-muted">
          <span><strong className="text-female">{result.femaleCount}</strong> non-men</span>
          <span><strong className="text-male">{result.maleCount}</strong> men</span>
          {result.unknownCount > 0 && (
            <span><strong className="text-unknown">{result.unknownCount}</strong> unknown</span>
          )}
        </div>

        {result.weightedPercentage !== result.percentage && (
          <p className="text-center text-xs text-text-muted/60">
            {result.percentage}% by artist count &middot; {result.weightedPercentage}% weighted by listening
          </p>
        )}

        <ArtistGrid artists={result.artists} />

        <div className="flex flex-col items-center gap-4 pt-4">
          <ShareButton percentage={result.weightedPercentage} tier={result.tier} roast={result.roast} />
          <a href="/api/auth/logout" className="text-text-muted text-sm hover:text-accent transition-colors">
            log out &amp; try someone else
          </a>
        </div>

        <p className="text-center text-text-muted/40 text-xs pt-8">
          gender data from wikidata + ai. bands with any non-male member count as non-men.
        </p>
      </div>
    </main>
  );
}
