import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { plaidClient, getPlaidAccessTokens } from "@/lib/plaid";
import { AccountType } from "plaid";

export interface PlaidSnapshot {
  net_worth: number;
  liquid: number;
  invested: number;
  liabilities: number;
  accounts: Array<{ name: string; type: string; subtype: string | null; balance: number; institution?: string }>;
}

export async function GET() {
  const authed = await getSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tokens = await getPlaidAccessTokens();
  if (!tokens.length) return NextResponse.json({ connected: false });

  const client = plaidClient();
  const allAccounts: PlaidSnapshot["accounts"] = [];

  await Promise.all(
    tokens.map(async (token) => {
      try {
        const [balRes, itemRes] = await Promise.all([
          client.accountsBalanceGet({ access_token: token }),
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
        for (const acct of balRes.data.accounts) {
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
        console.error("Plaid balance fetch error:", e);
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
  };

  return NextResponse.json({ connected: true, snapshot });
}
