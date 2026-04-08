"use client";

import { useState } from "react";
import { Tier } from "@/lib/types";

export default function ShareButton({
  percentage,
  tier,
  roast,
}: {
  percentage: number;
  tier: Tier;
  roast?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleShare() {
    const text = `i scored ${percentage}% (${tier} tier) on "do you even listen to women?"`;
    const url = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {
        // fall through
      }
    }

    await navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadStory() {
    setDownloading(true);
    try {
      const params = new URLSearchParams({
        s: String(percentage),
        t: tier,
        f: "story",
      });
      if (roast) params.set("r", roast);

      const res = await fetch(`/api/og?${params}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `woman-listener-${tier}-${percentage}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // fallback
    }
    setDownloading(false);
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleShare}
        className="bg-surface hover:bg-surface-light border border-surface-light text-text font-medium rounded-xl px-5 py-3 transition-all text-sm cursor-pointer"
      >
        {copied ? "copied!" : "share link"}
      </button>
      <button
        onClick={handleDownloadStory}
        disabled={downloading}
        className="bg-accent hover:bg-accent/90 text-white font-medium rounded-xl px-5 py-3 transition-all text-sm cursor-pointer disabled:opacity-50"
      >
        {downloading ? "..." : "download for stories"}
      </button>
    </div>
  );
}
