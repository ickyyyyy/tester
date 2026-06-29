import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  return NextResponse.json({
    GOOGLE_CLIENT_ID: clientId
      ? `${clientId.slice(0, 20)}...${clientId.slice(-10)} (len=${clientId.length})`
      : "NOT SET",
    GOOGLE_CLIENT_SECRET: clientSecret
      ? `${clientSecret.slice(0, 8)}... (len=${clientSecret.length})`
      : "NOT SET",
  });
}
