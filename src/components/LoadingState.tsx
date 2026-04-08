"use client";

import { useState, useEffect } from "react";

const STEPS = [
  { message: "connecting to spotify...", delay: 0 },
  { message: "pulling your top artists...", delay: 2000 },
  { message: "checking who's a woman...", delay: 5000 },
  { message: "consulting wikidata...", delay: 8000 },
  { message: "crunching the numbers...", delay: 12000 },
  { message: "preparing your roast...", delay: 16000 },
  { message: "almost there...", delay: 20000 },
];

export default function LoadingState() {
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const now = Date.now() - start;
      setElapsed(now);
      const nextStep = STEPS.findIndex((s) => s.delay > now);
      setStepIndex(
        nextStep === -1 ? STEPS.length - 1 : Math.max(0, nextStep - 1)
      );
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const progress = Math.min(95, (elapsed / 25000) * 100);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
      <div className="w-16 h-16 rounded-full border-4 border-surface-light border-t-accent animate-spin" />
      <p className="text-text-muted text-lg">{STEPS[stepIndex].message}</p>
      <div className="w-64 h-1.5 bg-surface-light rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-text-muted/40 text-xs">this usually takes 10-20 seconds</p>
    </div>
  );
}
