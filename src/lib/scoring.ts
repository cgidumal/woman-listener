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
    "Your Spotify is a sausage fest. The algorithm is begging you to discover that women also make music.",
    "Zero women? Not even by accident? That takes commitment.",
    "The only female voice on your Spotify is Siri reading you the error message.",
    "Genuinely impressive how you managed to avoid 50% of all artists.",
  ],
  D: [
    "You found a couple women artists. Probably by accident. Probably Adele.",
    "The bar was on the floor and you barely cleared it.",
    "Your Spotify's idea of gender diversity is listening to a band with a female backup vocalist.",
    "You listen to women the way you read terms and conditions — technically, barely.",
  ],
  C: [
    "Solidly mid. You listen to women the way you 'support' women — occasionally, when convenient.",
    "You acknowledge women exist in music. Congratulations on the bare minimum.",
    "Perfectly mediocre. You're the participation trophy of music taste.",
    "Not terrible, not great. Like lukewarm water. You are lukewarm water.",
  ],
  B: [
    "Not bad. You've clearly heard of women. Some of your playlists might even pass the vibe check.",
    "Above average! Your Spotify has more range than most people's personalities.",
    "Decent taste. You actually seek out music instead of just letting the algorithm feed you slop.",
    "You're doing better than most. Low bar, but hey.",
  ],
  A: [
    "You actually listen to women. Like, genuinely. This is rare. Your ears have taste.",
    "Impressive range. You treat women in music like they're… regular artists. Revolutionary concept.",
    "Your Spotify has almost as many women as a Beyoncé concert. Almost.",
    "You're proof that having good taste isn't that hard — most people just refuse.",
  ],
  S: [
    "You are the moment. Your Spotify is a feminist utopia. Someone give this person a medal.",
    "Your playlist is more inclusive than most corporate diversity initiatives.",
    "You don't just listen to women — you're a patron of the arts. Iconic behavior.",
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
  const female = known.filter((a) => a.gender === "female");
  const male = known.filter((a) => a.gender === "male");
  const unknown = artists.filter((a) => a.gender === "unknown");
  const percentage =
    known.length > 0 ? Math.round((female.length / known.length) * 100) : 0;
  const tier = getTier(percentage);

  return {
    artists,
    totalKnown: known.length,
    femaleCount: female.length,
    maleCount: male.length,
    unknownCount: unknown.length,
    percentage,
    tier,
    roast: getRoast(tier),
    mode,
    stats,
  };
}
