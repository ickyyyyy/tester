import { createClient } from "@supabase/supabase-js";

// Server-only admin client (service role, bypasses RLS)
// Called at request time so env vars are always available
export function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
