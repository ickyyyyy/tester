import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";

const PLAID_TOKEN_DATE = "2000-01-05";

export function plaidClient() {
  const env = process.env.PLAID_ENV ?? "sandbox";
  const config = new Configuration({
    basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments] ?? PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
        "PLAID-SECRET": process.env.PLAID_SECRET!,
      },
    },
  });
  return new PlaidApi(config);
}

export async function getPlaidAccessTokens(): Promise<string[]> {
  const db = adminClient();
  const { data } = await db
    .from("daily_logs")
    .select("notes")
    .eq("user_id", OPERATOR.userId)
    .eq("log_date", PLAID_TOKEN_DATE)
    .maybeSingle();
  if (!data?.notes) return [];
  try {
    const parsed = JSON.parse(data.notes as string);
    return parsed.access_tokens ?? [];
  } catch { return []; }
}

export async function addPlaidAccessToken(token: string) {
  const tokens = await getPlaidAccessTokens();
  if (!tokens.includes(token)) tokens.push(token);
  const db = adminClient();
  await db.from("daily_logs").upsert(
    {
      user_id: OPERATOR.userId,
      log_date: PLAID_TOKEN_DATE,
      notes: JSON.stringify({ access_tokens: tokens }),
    },
    { onConflict: "user_id,log_date" }
  );
}
