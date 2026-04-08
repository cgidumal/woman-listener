import { NextResponse } from "next/server";
import { extractUserId, fetchPublicPlaylists } from "@/lib/spotify";
import { queryArtistGenders } from "@/lib/wikidata";
import { calculateScore } from "@/lib/scoring";
import { ArtistWithGender } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing Spotify URL" }, { status: 400 });
    }

    const userId = extractUserId(url);
    if (!userId) {
      return NextResponse.json(
        { error: "Could not parse Spotify profile URL" },
        { status: 400 }
      );
    }

    // Fetch public playlists
    const { artists, playlistCount } = await fetchPublicPlaylists(userId);

    if (artists.length === 0) {
      return NextResponse.json(
        { error: "No public playlists found for this user" },
        { status: 404 }
      );
    }

    // Query genders
    const artistNames = artists.map((a) => a.name);
    const genderMap = await queryArtistGenders(artistNames);

    // Merge
    const artistsWithGender: ArtistWithGender[] = artists.map((a) => ({
      ...a,
      gender: genderMap.get(a.name) ?? "unknown",
    }));

    const result = calculateScore(artistsWithGender, "lookup", { playlistCount });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Lookup error:", error);
    return NextResponse.json(
      { error: "Failed to analyze profile. The user may not exist or has no public playlists." },
      { status: 500 }
    );
  }
}
