import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { plaidClient } from "@/lib/plaid";
import { CountryCode, Products } from "plaid";
import { OPERATOR } from "@/lib/config/operator";

export async function POST() {
  const authed = await getSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await plaidClient().linkTokenCreate({
      user: { client_user_id: OPERATOR.userId },
      client_name: "Landin OS",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });
    return NextResponse.json({ link_token: res.data.link_token });
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: unknown } })?.response?.data ?? String(e);
    console.error("Plaid link token error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
