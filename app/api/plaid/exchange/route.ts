import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { plaidClient, addPlaidAccessToken } from "@/lib/plaid";

export async function POST(req: NextRequest) {
  const authed = await getSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { public_token } = await req.json();
  try {
    const res = await plaidClient().itemPublicTokenExchange({ public_token });
    await addPlaidAccessToken(res.data.access_token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Plaid exchange error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
