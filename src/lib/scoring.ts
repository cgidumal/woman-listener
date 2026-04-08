import { ArtistWithGender, Tier, AnalysisResult } from "./types";

const TIER_THRESHOLDS: { min: number; tier: Tier }[] = [
  { min: 61, tier: "S" },
  { min: 46, tier: "A" },
  { min: 31, tier: "B" },
  { min: 16, tier: "C" },
  { min: 6, tier: "D" },
  { min: 0, tier: "F" },
];

const ROASTS: Record<Tier, string[]> = {
  F: [
    "Your Spotify is a sausage fest. The algorithm is begging you to discover that non-men also make music.",
    "Zero non-men? Not even by accident? That takes commitment.",
    "The only non-male voice on your Spotify is Siri reading you the error message.",
    "Genuinely impressive how you managed to avoid half of all artists.",
  ],
  D: [
    "You found a couple non-male artists. Probably by accident. Probably Adele.",
    "The bar was on the floor and you barely cleared it.",
    "Your Spotify's idea of gender diversity is listening to a band with a female backup vocalist.",
    "You listen to non-men the way you read terms and conditions — technically, barely.",
  ],
  C: [
    "Solidly mid. You listen to non-men the way you 'support' them — occasionally, when convenient.",
    "You acknowledge non-men exist in music. Congratulations on the bare minimum.",
    "Perfectly mediocre. You're the participation trophy of music taste.",
    "Not terrible, not great. Like lukewarm water. You are lukewarm water.",
  ],
  B: [
    "Your Spotify is like a group project where you did some of the work. Some.",
    "You're giving 'I have female friends' energy. Like, technically true. Technically.",
    "You've discovered women make music. Now discover more of them. We believe in you. Barely.",
    "Somewhere between 'I respect women' and actually proving it. The algorithm is doing the heavy lifting here.",
  ],
  A: [
    "OK we see you. Your Spotify looks like it was curated by someone who's been to therapy. Congratulations on your growth.",
    "You're the friend everyone trusts with the aux. Don't let it go to your head. Too late.",
    "Your taste in music is better than your taste in literally everything else. Statistically speaking.",
    "A-tier means you listen to women almost as much as you talk about listening to women. Almost.",
  ],
  S: [
    "You are the moment. Your Spotify is an inclusive utopia. Someone give this person a medal.",
    "Your playlist is more inclusive than most corporate diversity initiatives.",
    "You don't just listen to non-men — you're a patron of the arts. Iconic behavior.",
    "We have nothing to roast. You're out here actually listening. A unicorn in the wild.",
  ],
};

function getTier(percentage: number): Tier {
  for (const { min, tier } of TIER_THRESHOLDS) {
    if (percentage >= min) return tier;
  }
  return "F";
}

function getRoast(tier: Tier): string {
  const options = ROASTS[tier];
  return options[Math.floor(Math.random() * options.length)];
}

export function calculateScore(
  artists: ArtistWithGender[],
  mode: "lookup" | "full",
  stats?: AnalysisResult["stats"]
): AnalysisResult {
  const known = artists.filter((a) => a.gender !== "unknown");
  const nonMen = known.filter(
    (a) => a.gender === "female" || a.gender === "non-binary"
  );
  const male = known.filter((a) => a.gender === "male");
  const unknown = artists.filter((a) => a.gender === "unknown");

  // Simple percentage (unweighted)
  const percentage =
    known.length > 0 ? Math.round((nonMen.length / known.length) * 100) : 0;

  // Weighted percentage: top-ranked artists count more
  // Weight = 51 - rank (so #1 = 50 weight, #50 = 1 weight)
  // Artists without a rank (from saved/followed, not top) get weight 1
  let weightedNonMen = 0;
  let weightedTotal = 0;
  for (const a of known) {
    const weight = a.rank ? Math.max(1, 51 - a.rank) : 1;
    weightedTotal += weight;
    if (a.gender === "female" || a.gender === "non-binary") {
      weightedNonMen += weight;
    }
  }
  const weightedPercentage =
    weightedTotal > 0 ? Math.round((weightedNonMen / weightedTotal) * 100) : 0;

  // Use weighted percentage for the tier/roast
  const tier = getTier(weightedPercentage);

  // Sort artists: ranked first (by rank), then unranked
  const sorted = [...artists].sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    if (a.rank) return -1;
    if (b.rank) return 1;
    return 0;
  });

  return {
    artists: sorted,
    totalKnown: known.length,
    femaleCount: nonMen.length,
    maleCount: male.length,
    unknownCount: unknown.length,
    percentage,
    weightedPercentage,
    tier,
    roast: getRoast(tier),
    mode,
    stats,
  };
}
