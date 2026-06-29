import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE = "os-session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "fallback-dev-secret");

export async function signSession(): Promise<string> {
  return new SignJWT({ ok: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function getSession(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;
  return verifySession(token);
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Check auth in API routes — cookie OR x-api-secret header */
export function isAuthorizedRequest(req: NextRequest): boolean {
  const apiSecret = process.env.API_SECRET;
  if (apiSecret && req.headers.get("x-api-secret") === apiSecret) return true;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const bearer = req.headers.get("authorization");
    if (bearer === `Bearer ${cronSecret}`) return true;
  }
  // Cookie check happens server-side via getSession(); for API routes we'll
  // rely on the header secrets or call getSession() from the route handler.
  return false;
}
