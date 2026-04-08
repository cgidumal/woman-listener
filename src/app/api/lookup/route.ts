import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { extractUserId, fetchPublicPlaylists } from "@/lib/spotify";
import { queryArtistGenders } from "@/lib/wikidata";
import { calculateScore } from "@/lib/scoring";
import { ArtistWithGender } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("spotify_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated. Connect Spotify first." },
        { status: 401 }
      );
    }

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

    // Fetch public playlists using the authenticated user's token
    console.log(`[lookup] fetching playlists for user: ${userId}, token: ${token.slice(0, 10)}...`);
    const { artists, playlistCount } = await fetchPublicPlaylists(userId, token);

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
    const msg = String(error);
    if (msg.includes("401")) {
      return NextResponse.json(
        { error: "Your session expired. Go back and reconnect Spotify." },
        { status: 401 }
      );
    }
    if (msg.includes("403")) {
      return NextResponse.json(
        { error: "Spotify blocked access to this user's playlists. They may have no public playlists." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to analyze profile. Try again." },
      { status: 500 }
    );
  }
}
