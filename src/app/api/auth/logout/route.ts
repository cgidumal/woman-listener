import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/`
  );

  // Clear the Spotify token cookie
  response.cookies.set("spotify_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
