"use client";

import { useState } from "react";
import { Tier } from "@/lib/types";

export default function ShareButton({
  percentage,
  tier,
}: {
  percentage: number;
  tier: Tier;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = `i scored ${percentage}% (${tier} tier) on "do you even listen to women?" — audit your spotify:`;
    const url = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="bg-surface hover:bg-surface-light border border-surface-light text-text font-medium rounded-xl px-6 py-3 transition-all text-sm cursor-pointer"
    >
      {copied ? "copied!" : "share your score"}
    </button>
  );
}
