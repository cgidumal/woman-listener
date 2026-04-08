import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  fetchTopArtists,
  fetchRecentlyPlayed,
  fetchSavedTracks,
  fetchFollowedArtists,
  fetchUserPlaylists,
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
    const [topShort, topMedium, topLong, recent, saved, followed, playlists] =
      await Promise.allSettled([
        fetchTopArtists(token, "short_term"),
        fetchTopArtists(token, "medium_term"),
        fetchTopArtists(token, "long_term"),
        fetchRecentlyPlayed(token),
        fetchSavedTracks(token),
        fetchFollowedArtists(token),
        fetchUserPlaylists(token),
      ]);

    // Deduplicate all artists by ID
    const artistMap = new Map<string, SpotifyArtist>();
    const allSources = [topShort, topMedium, topLong, recent, saved, followed, playlists];

    for (const result of allSources) {
      if (result.status === "fulfilled") {
        for (const artist of result.value) {
          if (!artistMap.has(artist.id)) {
            artistMap.set(artist.id, artist);
          } else {
            // Prefer the version with more data (images, genres)
            const existing = artistMap.get(artist.id)!;
            if (artist.images.length > existing.images.length) {
              artistMap.set(artist.id, artist);
            }
          }
        }
      }
    }

    const artists = Array.from(artistMap.values());

    if (artists.length === 0) {
      return NextResponse.json(
        { error: "No artists found in your Spotify library." },
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

    const stats = {
      likedSongsCount: saved.status === "fulfilled" ? saved.value.length : 0,
      followedArtistsCount: followed.status === "fulfilled" ? followed.value.length : 0,
      playlistCount: playlists.status === "fulfilled" ? playlists.value.length : 0,
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
