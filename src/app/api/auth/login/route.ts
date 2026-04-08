import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/spotify";

export async function GET() {
  const state = crypto.randomUUID();
  const authUrl = buildAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("spotify_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
