import { createClient } from "@supabase/supabase-js";

// NOTE: This client bypasses Row Level Security and must ONLY be used on the server
// for administrative tasks (like approving gurus or running migration verification).
// The SUPABASE_SERVICE_ROLE_KEY is kept strictly in .env.local and is never sent to the client.

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in server environment."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

