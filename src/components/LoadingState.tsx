"use client";

import { useState, useEffect } from "react";

const MESSAGES = [
  "checking the receipts...",
  "consulting wikidata...",
  "counting the women...",
  "preparing your roast...",
  "this might hurt...",
  "auditing your taste...",
  "the results are in...",
];

export default function LoadingState() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
      <div className="w-16 h-16 rounded-full border-4 border-surface-light border-t-accent animate-spin" />
      <p className="text-text-muted text-lg animate-pulse-slow">
        {MESSAGES[msgIndex]}
      </p>
    </div>
  );
}
