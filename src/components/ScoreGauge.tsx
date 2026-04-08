import { Tier } from "@/lib/types";

const TIER_COLORS: Record<Tier, string> = {
  F: "text-danger",
  D: "text-danger",
  C: "text-warning",
  B: "text-accent-soft",
  A: "text-success",
  S: "text-success",
};

const TIER_BG: Record<Tier, string> = {
  F: "bg-danger/20",
  D: "bg-danger/20",
  C: "bg-warning/20",
  B: "bg-accent-soft/20",
  A: "bg-success/20",
  S: "bg-success/20",
};

const TIER_LABELS: Record<Tier, string> = {
  F: "catastrophic",
  D: "lacking",
  C: "mid",
  B: "decent",
  A: "respectful",
  S: "icon",
};

export default function ScoreGauge({
  percentage,
  tier,
}: {
  percentage: number;
  tier: Tier;
}) {
  return (
    <div className="flex flex-col items-center gap-3 animate-count-up">
      <div
        className={`w-36 h-36 rounded-full ${TIER_BG[tier]} flex items-center justify-center`}
      >
        <div className="text-center">
          <div className={`text-5xl font-bold ${TIER_COLORS[tier]}`}>
            {percentage}%
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-2xl font-bold ${TIER_COLORS[tier]}`}
        >
          {tier}
        </span>
        <span className="text-text-muted text-sm uppercase tracking-wider">
          {TIER_LABELS[tier]}
        </span>
      </div>
    </div>
  );
}
