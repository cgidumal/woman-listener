import { ImageResponse } from "next/og";
import { Tier } from "@/lib/types";

export const runtime = "edge";

const TIER_COLORS: Record<Tier, string> = {
  F: "#ff3b30",
  D: "#ff3b30",
  C: "#ffcc02",
  B: "#f5a6b8",
  A: "#53d769",
  S: "#53d769",
};

const TIER_LABELS: Record<Tier, string> = {
  F: "catastrophic",
  D: "lacking",
  C: "mid",
  B: "decent",
  A: "respectful",
  S: "icon",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const score = url.searchParams.get("s") || "0";
  const tier = (url.searchParams.get("t") || "F") as Tier;
  const color = TIER_COLORS[tier] || TIER_COLORS.F;
  const label = TIER_LABELS[tier] || TIER_LABELS.F;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 32,
            color: "#8a8a8a",
            marginBottom: 20,
          }}
        >
          do you even listen to women?
        </div>
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color,
            lineHeight: 1,
          }}
        >
          {score}%
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 16,
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: 700,
              color,
            }}
          >
            {tier}
          </span>
          <span
            style={{
              fontSize: 24,
              color: "#8a8a8a",
              textTransform: "uppercase",
              letterSpacing: 4,
            }}
          >
            {label}
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
