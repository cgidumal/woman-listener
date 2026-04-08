import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  fetchTopArtists,
  fetchRecentlyPlayed,
  fetchSavedTracks,
  fetchFollowedArtists,
} from "@/lib/spotify";
import { queryArtistGenders } from "@/lib/wikidata";
import { calculateScore } from "@/lib/scoring";
import { SpotifyArtist, ArtistWithGender } from "@/lib/types";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("spotify_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated. Please connect Spotify first." },
        { status: 401 }
      );
    }

    // Fetch everything in parallel
    const [topShort, topMedium, topLong, recent, saved, followed] =
      await Promise.allSettled([
        fetchTopArtists(token, "short_term"),
        fetchTopArtists(token, "medium_term"),
        fetchTopArtists(token, "long_term"),
        fetchRecentlyPlayed(token),
        fetchSavedTracks(token),
        fetchFollowedArtists(token),
      ]);

    // Assign ranks from top artists (best rank across all time ranges)
    const artistRanks = new Map<string, number>();
    for (const result of [topShort, topMedium, topLong]) {
      if (result.status === "fulfilled") {
        result.value.forEach((artist, index) => {
          const existing = artistRanks.get(artist.id);
          const rank = index + 1;
          if (!existing || rank < existing) {
            artistRanks.set(artist.id, rank);
          }
        });
      }
    }

    // Deduplicate all artists by ID
    const artistMap = new Map<string, SpotifyArtist>();
    for (const result of [topShort, topMedium, topLong, recent, saved, followed]) {
      if (result.status === "fulfilled") {
        for (const artist of result.value) {
          if (!artistMap.has(artist.id)) {
            artistMap.set(artist.id, {
              ...artist,
              rank: artistRanks.get(artist.id),
            });
          } else {
            const existing = artistMap.get(artist.id)!;
            if (artist.images.length > existing.images.length) {
              artistMap.set(artist.id, {
                ...artist,
                rank: artistRanks.get(artist.id),
              });
            }
          }
        }
      }
    }

    // Also deduplicate by normalized name (catches "Sister Sparrow" vs "Sister Sparow")
    const seenNames = new Set<string>();
    const artists = Array.from(artistMap.values()).filter((a) => {
      const key = a.name.toLowerCase().trim();
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    });

    if (artists.length === 0) {
      return NextResponse.json(
        { error: "No artists found in your Spotify library." },
        { status: 404 }
      );
    }

    // Query genders via Wikidata (cached, so repeat lookups are instant)
    const artistNames = artists.map((a) => a.name);
    const genderMap = await queryArtistGenders(artistNames);

    const artistsWithGender: ArtistWithGender[] = artists.map((a) => ({
      ...a,
      gender: genderMap.get(a.name) ?? "unknown",
    }));

    const stats = {
      likedSongsCount: saved.status === "fulfilled" ? saved.value.length : 0,
      followedArtistsCount: followed.status === "fulfilled" ? followed.value.length : 0,
    };

    const result = calculateScore(artistsWithGender, "full", stats);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze your Spotify library." },
      { status: 500 }
    );
  }
}
