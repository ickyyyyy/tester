import { NextResponse } from "next/server";

let cache: { btc: number | null; xau: number | null; ndx: number | null; ts: number } = { btc: null, xau: null, ndx: null, ts: 0 };

export async function GET() {
  if (Date.now() - cache.ts < 60_000) {
    return NextResponse.json({ btc: cache.btc, xau: cache.xau, ndx: cache.ndx });
  }

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const data = await res.json();
      cache = { btc: data.bitcoin?.usd ?? null, xau: cache.xau, ndx: cache.ndx, ts: Date.now() };
    }
  } catch {
    // leave cached value
  }

  return NextResponse.json({ btc: cache.btc, xau: cache.xau, ndx: cache.ndx });
}
