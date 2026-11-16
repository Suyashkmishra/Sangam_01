import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...vals] = trimmed.split("=");
      if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  }
}

loadEnv();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function deleteTestAccounts() {
  console.log("Searching for test accounts named 'Test Guru' or 'hgjgjgv'...");
  
  // Find in profiles
  const { data: testProfiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, role")
    .or("full_name.ilike.%Test Guru%,full_name.ilike.%hgjgjgv%");

  if (error) {
    console.error("Error querying profiles:", error);
    return;
  }

  console.log(`Found ${testProfiles?.length || 0} matching profile(s):`, testProfiles);

  if (!testProfiles || testProfiles.length === 0) {
    console.log("No test profiles found to delete.");
    return;
  }

  for (const prof of testProfiles) {
    // Safety check: NEVER delete Tarun Sengupta, Sangam Admin, or demo accounts
    if (prof.id.startsWith("a000") || prof.id.startsWith("b000") || prof.id.startsWith("c000")) {
      console.warn(`Skipping core demo account ${prof.full_name} (${prof.id})`);
      continue;
    }

    console.log(`\nDeleting test user: "${prof.full_name}" (ID: ${prof.id})...`);

    // 1. Delete associated payments
    await supabaseAdmin.from("payments").delete().eq("user_id", prof.id);

    // 2. Delete associated notifications
    await supabaseAdmin.from("notifications").delete().or(`user_id.eq.${prof.id},actor_id.eq.${prof.id}`);

    // 3. Delete associated connections
    await supabaseAdmin.from("connections").delete().or(`guru_id.eq.${prof.id},shishya_id.eq.${prof.id}`);

    // 4. Delete associated comments
    await supabaseAdmin.from("comments").delete().eq("user_id", prof.id);

    // 5. Delete associated likes
    await supabaseAdmin.from("likes").delete().eq("user_id", prof.id);

    // 6. Delete posts
    await supabaseAdmin.from("posts").delete().eq("author_id", prof.id);

    // 7. Delete profile contacts
    await supabaseAdmin.from("profile_contacts").delete().eq("user_id", prof.id);

    // 8. Delete profile row
    await supabaseAdmin.from("profiles").delete().eq("id", prof.id);

    // 9. Delete auth user from Supabase Auth
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(prof.id);
    if (authErr) {
      console.error(`Error deleting auth user ${prof.id}:`, authErr.message);
    } else {
      console.log(`Successfully deleted auth user ${prof.id}`);
    }
  }

  console.log("\nFinished cleaning up test accounts.");
}

deleteTestAccounts().catch(console.error);
