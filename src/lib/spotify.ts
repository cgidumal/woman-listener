import { SpotifyArtist, TimeRange } from "./types";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

const SCOPES = [
  "user-top-read",
  "user-read-recently-played",
  "user-library-read",
  "playlist-read-private",
  "user-follow-read",
].join(" ");

// --- Client Credentials (for paste-URL mode) ---

let cachedClientToken: { token: string; expiresAt: number } | null = null;

export async function getClientToken(): Promise<string> {
  if (cachedClientToken && Date.now() < cachedClientToken.expiresAt) {
    return cachedClientToken.token;
  }

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error(`Spotify client credentials failed: ${res.status}`);

  const data = await res.json();
  cachedClientToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

// --- OAuth (for connect mode) ---

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: SCOPES,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    state,
  });
  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    }),
  });

  if (!res.ok) throw new Error(`Spotify token exchange failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

// --- Spotify API calls ---

async function spotifyGet(path: string, token: string) {
  const res = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[spotify] ${path} failed: ${res.status} ${body}`);
    throw new Error(`Spotify API ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchTopArtists(
  token: string,
  timeRange: TimeRange = "medium_term"
): Promise<SpotifyArtist[]> {
  const data = await spotifyGet(
    `/me/top/artists?limit=50&time_range=${timeRange}`,
    token
  );
  return data.items;
}

export async function fetchRecentlyPlayed(token: string): Promise<SpotifyArtist[]> {
  const data = await spotifyGet("/me/player/recently-played?limit=50", token);
  const artistMap = new Map<string, SpotifyArtist>();
  for (const item of data.items) {
    const artist = item.track.artists[0]; // primary artist only
    if (!artistMap.has(artist.id)) {
      // Recently played gives minimal artist data, fetch full if needed
      artistMap.set(artist.id, {
        id: artist.id,
        name: artist.name,
        images: [],
        genres: [],
        popularity: 0,
      });
    }
  }
  return Array.from(artistMap.values());
}

export async function fetchSavedTracks(token: string): Promise<SpotifyArtist[]> {
  const artistMap = new Map<string, SpotifyArtist>();
  let url = "/me/tracks?limit=50";
  let pages = 0;
  const maxPages = 10; // cap at 500 tracks for speed

  while (url && pages < maxPages) {
    const data = await spotifyGet(url, token);
    for (const item of data.items) {
      const artist = item.track.artists[0]; // primary artist only
      if (!artistMap.has(artist.id)) {
        artistMap.set(artist.id, {
          id: artist.id,
          name: artist.name,
          images: [],
          genres: [],
          popularity: 0,
        });
      }
    }
    url = data.next ? data.next.replace(SPOTIFY_API_BASE, "") : null;
    pages++;
  }
  return Array.from(artistMap.values());
}

export async function fetchFollowedArtists(token: string): Promise<SpotifyArtist[]> {
  const artists: SpotifyArtist[] = [];
  let after: string | null = null;
  let pages = 0;

  while (pages < 20) {
    const params = after ? `?type=artist&limit=50&after=${after}` : "?type=artist&limit=50";
    const data = await spotifyGet(`/me/following${params}`, token);
    const items = data.artists.items;
    artists.push(...items);
    after = data.artists.cursors?.after ?? null;
    if (!after) break;
    pages++;
  }
  return artists;
}

export async function fetchUserPlaylists(token: string): Promise<SpotifyArtist[]> {
  const artistMap = new Map<string, SpotifyArtist>();

  // Get user's playlists
  const playlistData = await spotifyGet("/me/playlists?limit=50", token);
  const playlists = playlistData.items.slice(0, 20); // cap at 20 playlists

  for (const playlist of playlists) {
    try {
      const trackData = await spotifyGet(
        `/playlists/${playlist.id}/tracks?limit=100&fields=items(track(artists(id,name)))`,
        token
      );
      for (const item of trackData.items) {
        if (!item.track?.artists?.[0]) continue;
        const artist = item.track.artists[0];
        if (!artistMap.has(artist.id)) {
          artistMap.set(artist.id, {
            id: artist.id,
            name: artist.name,
            images: [],
            genres: [],
            popularity: 0,
          });
        }
      }
    } catch {
      // Skip playlists we can't access
    }
  }
  return Array.from(artistMap.values());
}

// --- Public profile lookup (paste URL mode) ---

export function extractUserId(input: string): string | null {
  // Handle URLs like:
  // https://open.spotify.com/user/xyz
  // spotify:user:xyz
  // or just the username
  const urlMatch = input.match(/open\.spotify\.com\/user\/([^?/]+)/);
  if (urlMatch) return urlMatch[1];

  const uriMatch = input.match(/spotify:user:(.+)/);
  if (uriMatch) return uriMatch[1];

  // Assume it's a raw username if no special chars
  if (/^[\w.-]+$/.test(input.trim())) return input.trim();

  return null;
}

export async function fetchPublicPlaylists(userId: string, token: string): Promise<{
  artists: SpotifyArtist[];
  playlistCount: number;
}> {
  const artistMap = new Map<string, SpotifyArtist>();

  const playlistData = await spotifyGet(`/users/${userId}/playlists?limit=50`, token);
  const playlists = playlistData.items.filter(
    (p: { public: boolean }) => p.public
  );

  for (const playlist of playlists.slice(0, 30)) {
    try {
      const trackData = await spotifyGet(
        `/playlists/${playlist.id}/tracks?limit=100&fields=items(track(artists(id,name,images)))`,
        token
      );
      for (const item of trackData.items) {
        if (!item.track?.artists?.[0]) continue;
        const artist = item.track.artists[0];
        if (!artistMap.has(artist.id)) {
          artistMap.set(artist.id, {
            id: artist.id,
            name: artist.name,
            images: item.track.artists[0].images || [],
            genres: [],
            popularity: 0,
          });
        }
      }
    } catch {
      // Skip inaccessible playlists
    }
  }

  return {
    artists: Array.from(artistMap.values()),
    playlistCount: playlists.length,
  };
}
