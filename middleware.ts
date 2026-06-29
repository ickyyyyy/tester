import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "os-session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "fallback-dev-secret");

const PUBLIC = [
  /^\/login(\/.*)?$/,
  /^\/api\/auth\//,
  /^\/api\/telegram\//,
  /^\/_next\//,
  /^\/favicon\.ico$/,
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some((r) => r.test(pathname))) return NextResponse.next();

  // x-api-secret bypass for programmatic access
  const apiSecret = process.env.API_SECRET;
  if (apiSecret && req.headers.get("x-api-secret") === apiSecret) {
    return NextResponse.next();
  }

  // CRON_SECRET bypass
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const bearer = req.headers.get("authorization");
    if (bearer === `Bearer ${cronSecret}`) return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  if (token) {
    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      // fall through to redirect
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
