import { NextRequest, NextResponse } from "next/server";
import { storeGoogleTokens, appUrl } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${appUrl()}/?calendar=error`);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl()}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    console.error("Token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(`${appUrl()}/?calendar=error`);
  }

  const tokens = await tokenRes.json();
  await storeGoogleTokens(tokens.access_token, tokens.refresh_token, tokens.expires_in);

  return NextResponse.redirect(`${appUrl()}/?calendar=connected`);
}
