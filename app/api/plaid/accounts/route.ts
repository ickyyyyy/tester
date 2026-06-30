import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { plaidClient, getPlaidAccessTokens } from "@/lib/plaid";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";
import { AccountType } from "plaid";

export interface PlaidSnapshot {
  net_worth: number;
  liquid: number;
  invested: number;
  liabilities: number;
  accounts: Array<{ name: string; type: string; subtype: string | null; balance: number; institution?: string }>;
  fetched_at: string;
}

const CACHE_DATE = "2000-01-06";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function loadCache(): Promise<PlaidSnapshot | null> {
  const db = adminClient();
  const { data } = await db
    .from("daily_logs")
    .select("notes")
    .eq("user_id", OPERATOR.userId)
    .eq("log_date", CACHE_DATE)
    .maybeSingle();
  if (!data?.notes) return null;
  try {
    const snap: PlaidSnapshot = JSON.parse(data.notes as string);
    if (Date.now() - new Date(snap.fetched_at).getTime() < CACHE_TTL_MS) return snap;
    return null; // stale
  } catch { return null; }
}

async function saveCache(snap: PlaidSnapshot) {
  const db = adminClient();
  await db.from("daily_logs").upsert(
    { user_id: OPERATOR.userId, log_date: CACHE_DATE, notes: JSON.stringify(snap) },
    { onConflict: "user_id,log_date" }
  );
}

export async function GET() {
  const authed = await getSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tokens = await getPlaidAccessTokens();
  if (!tokens.length) return NextResponse.json({ connected: false });

  // Return cached data if fresh
  const cached = await loadCache();
  if (cached) return NextResponse.json({ connected: true, snapshot: cached, cached: true });

  // Fetch fresh data using accountsGet (free — returns Plaid's cached balances)
  const client = plaidClient();
  const allAccounts: PlaidSnapshot["accounts"] = [];

  await Promise.all(
    tokens.map(async (token) => {
      try {
        const [acctRes, itemRes] = await Promise.all([
          client.accountsGet({ access_token: token }),  // free call
          client.itemGet({ access_token: token }),
        ]);
        const instId = itemRes.data.item.institution_id;
        let instName = "";
        if (instId) {
          try {
            const instRes = await client.institutionsGetById({ institution_id: instId, country_codes: [] as never });
            instName = instRes.data.institution.name;
          } catch { /* ignore */ }
        }
        for (const acct of acctRes.data.accounts) {
          const balance = acct.balances.current ?? 0;
          allAccounts.push({
            name: acct.name,
            type: acct.type,
            subtype: acct.subtype ?? null,
            balance: acct.type === AccountType.Credit || acct.type === AccountType.Loan ? -Math.abs(balance) : balance,
            institution: instName,
          });
        }
      } catch (e) {
        console.error("Plaid accounts fetch error:", e);
      }
    })
  );

  let liquid = 0, invested = 0, liabilities = 0;
  for (const a of allAccounts) {
    if (a.type === AccountType.Depository) liquid += a.balance;
    else if (a.type === AccountType.Investment) invested += a.balance;
    else if (a.type === AccountType.Credit || a.type === AccountType.Loan) liabilities += Math.abs(a.balance);
  }

  const snapshot: PlaidSnapshot = {
    net_worth: liquid + invested - liabilities,
    liquid,
    invested,
    liabilities,
    accounts: allAccounts,
    fetched_at: new Date().toISOString(),
  };

  await saveCache(snapshot);
  return NextResponse.json({ connected: true, snapshot, cached: false });
}
