export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; height: number; width: number }[];
  genres: string[];
  popularity: number;
  rank?: number; // position in top artists (1 = most listened)
}

export interface ArtistWithGender extends SpotifyArtist {
  gender: "female" | "male" | "non-binary" | "unknown";
  wikidataId?: string;
}

export type TimeRange = "short_term" | "medium_term" | "long_term";

export type Tier = "S" | "A" | "B" | "C" | "D" | "F";

export interface AnalysisResult {
  artists: ArtistWithGender[];
  totalKnown: number;
  femaleCount: number;
  maleCount: number;
  unknownCount: number;
  percentage: number;
  weightedPercentage: number;
  tier: Tier;
  roast: string;
  mode: "lookup" | "full";
  stats?: {
    playlistCount?: number;
    likedSongsCount?: number;
    followedArtistsCount?: number;
  };
}
