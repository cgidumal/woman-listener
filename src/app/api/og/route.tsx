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
  const roast = url.searchParams.get("r") || "";
  const format = url.searchParams.get("f") || "og"; // "og" (1200x630) or "story" (1080x1920)
  const color = TIER_COLORS[tier] || TIER_COLORS.F;
  const label = TIER_LABELS[tier] || TIER_LABELS.F;

  const isStory = format === "story";
  const width = isStory ? 1080 : 1200;
  const height = isStory ? 1920 : 630;

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
          padding: isStory ? 80 : 40,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: isStory ? 48 : 32,
            color: "#8a8a8a",
            marginBottom: isStory ? 60 : 20,
            letterSpacing: -1,
          }}
        >
          do you even listen to{" "}
          <span style={{ color: "#e94560" }}>women</span>?
        </div>

        {/* Big score */}
        <div
          style={{
            fontSize: isStory ? 200 : 120,
            fontWeight: 700,
            color,
            lineHeight: 1,
          }}
        >
          {score}%
        </div>

        {/* Tier badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: isStory ? 24 : 16,
          }}
        >
          <span
            style={{
              fontSize: isStory ? 72 : 48,
              fontWeight: 700,
              color,
            }}
          >
            {tier}
          </span>
          <span
            style={{
              fontSize: isStory ? 36 : 24,
              color: "#8a8a8a",
              textTransform: "uppercase",
              letterSpacing: 6,
            }}
          >
            {label}
          </span>
        </div>

        {/* Roast */}
        {roast && (
          <div
            style={{
              fontSize: isStory ? 32 : 20,
              color: "#f0f0f0",
              marginTop: isStory ? 80 : 30,
              textAlign: "center",
              maxWidth: isStory ? 900 : 800,
              lineHeight: 1.4,
              fontStyle: "italic",
            }}
          >
            &ldquo;{roast}&rdquo;
          </div>
        )}

        {/* CTA */}
        {isStory && (
          <div
            style={{
              position: "absolute",
              bottom: 120,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 28, color: "#8a8a8a" }}>
              try it yourself
            </div>
            <div
              style={{
                fontSize: 24,
                color: "#1DB954",
                fontWeight: 600,
              }}
            >
              woman-listener.vercel.app
            </div>
          </div>
        )}
      </div>
    ),
    { width, height }
  );
}
