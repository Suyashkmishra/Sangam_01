import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.log("⚠️ NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY not yet configured in .env.local.");
  console.log("Please create .env.local with your real Supabase credentials and re-run this script.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, anonKey);

const DEMO_CREDENTIALS = [
  { role: "Admin", email: "admin.demo@sangam.test", password: "Demo@1234" },
  { role: "Guru (Verified)", email: "guru.demo@sangam.test", password: "Demo@1234" },
  { role: "Shishya", email: "shishya.demo@sangam.test", password: "Demo@1234" },
  { role: "Guru (Pending)", email: "pending.guru@sangam.test", password: "Demo@1234" },
];

async function verifyAll() {
  console.log("=================================================");
  console.log("   SANGAM SUPABASE LIVE INTEGRATION VERIFIER     ");
  console.log("=================================================\n");

  // 1. Check Table Accessibility
  console.log("1. Checking Database Tables...");
  const tables = ["profiles", "posts", "likes", "comments", "connections", "notifications", "payments", "profile_contacts"];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
    if (error && error.code !== "PGRST116") {
      // PGRST116 means 0 rows or RLS blocked without error
      console.log(`   - Table '${t}': ⚠️ ${error.message}`);
    } else {
      console.log(`   - Table '${t}': ✅ accessible (row count: ${count ?? 0})`);
    }
  }

  // 2. Verify Demo Logins
  console.log("\n2. Testing Demo Account Sign-ins...");
  for (const cred of DEMO_CREDENTIALS) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cred.email,
      password: cred.password,
    });

    if (error) {
      console.log(`   - ${cred.role} (${cred.email}): ❌ FAILED (${error.message})`);
    } else {
      console.log(`   - ${cred.role} (${cred.email}): ✅ SUCCESS (UID: ${data.user?.id})`);
      await supabase.auth.signOut();
    }
  }

  console.log("\n=================================================");
  console.log("   Verification Completed!                       ");
  console.log("=================================================");
}

verifyAll().catch(console.error);

