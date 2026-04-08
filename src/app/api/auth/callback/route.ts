import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForToken } from "@/lib/spotify";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=denied`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=missing_params`
    );
  }

  // Validate state
  const cookieStore = await cookies();
  const storedState = cookieStore.get("spotify_state")?.value;
  if (state !== storedState) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=invalid_state`
    );
  }

  try {
    const accessToken = await exchangeCodeForToken(code);

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/results`
    );

    // Store token in httpOnly cookie
    response.cookies.set("spotify_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour (matches Spotify token lifetime)
      path: "/",
    });

    // Clean up state cookie
    response.cookies.delete("spotify_state");

    return response;
  } catch (err) {
    console.error("Token exchange error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=token_failed`
    );
  }
}
