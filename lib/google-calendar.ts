import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";

const TOKEN_DATE = "2000-01-02"; // sentinel row for OAuth tokens

interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix ms
}

async function getStoredTokens(): Promise<StoredTokens | null> {
  const db = adminClient();
  const { data } = await db
    .from("daily_logs")
    .select("notes")
    .eq("user_id", OPERATOR.userId)
    .eq("log_date", TOKEN_DATE)
    .maybeSingle();
  if (!data?.notes) return null;
  try { return JSON.parse(data.notes as string); } catch { return null; }
}

async function saveTokens(tokens: StoredTokens) {
  const db = adminClient();
  await db.from("daily_logs").upsert({
    user_id: OPERATOR.userId,
    log_date: TOKEN_DATE,
    notes: JSON.stringify(tokens),
  }, { onConflict: "user_id,log_date" });
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  await saveTokens({
    access_token: data.access_token,
    refresh_token: refreshToken,
    expires_at: Date.now() + data.expires_in * 1000,
  });
  return data.access_token;
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getStoredTokens();
  if (!tokens) return null;
  if (Date.now() > tokens.expires_at - 5 * 60 * 1000) {
    return refreshAccessToken(tokens.refresh_token);
  }
  return tokens.access_token;
}

export async function storeGoogleTokens(accessToken: string, refreshToken: string, expiresIn: number) {
  await saveTokens({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Date.now() + expiresIn * 1000,
  });
}

export function appUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
