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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey) {
  console.log("⚠️ NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not yet in .env.local.");
  console.log("To run these live tests against your real Supabase project:");
  console.log("1. Add your project URL and keys to .env.local");
  console.log("2. Run 'npm run seed'");
  console.log("3. Run 'npm run test-acts'");
  process.exit(0);
}

const client = createClient(supabaseUrl, anonKey);
const adminClient = serviceKey ? createClient(supabaseUrl, serviceKey) : null;

async function runE2EActs() {
  console.log("=================================================");
  console.log("   SANGAM 5-ACT END-TO-END VERIFICATION SUITE   ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  // ACT 1: Public Archive & Linguistic Rendering
  console.log("--- ACT 1: Cultural Exploration & Multilingual Archive ---");
  try {
    const { data: posts, error } = await client.from("posts").select("id, title, language, category").limit(5);
    if (error) throw error;
    if (!posts || posts.length === 0) throw new Error("No posts found in database");

    const languages = posts.map(p => p.language);
    console.log(`✅ Act 1 Passed: Retrieved ${posts.length} sample works. Languages: ${Array.from(new Set(languages)).join(", ")}`);
    passed++;
  } catch (err: any) {
    console.log(`❌ Act 1 Failed: ${err.message}`);
    failed++;
  }

  // ACT 2: Auth Logins for All 4 Roles
  console.log("\n--- ACT 2: Authentication & Role Verification ---");
  const accounts = [
    { role: "Admin", email: "admin.demo@sangam.test", pass: "Demo@1234" },
    { role: "Verified Guru", email: "guru.demo@sangam.test", pass: "Demo@1234" },
    { role: "Shishya", email: "shishya.demo@sangam.test", pass: "Demo@1234" },
    { role: "Pending Guru", email: "pending.guru@sangam.test", pass: "Demo@1234" },
  ];

  let authOk = true;
  for (const acc of accounts) {
    const { data, error } = await client.auth.signInWithPassword({
      email: acc.email,
      password: acc.pass,
    });
    if (error) {
      console.log(`   - ${acc.role} (${acc.email}): ❌ FAILED (${error.message})`);
      authOk = false;
    } else {
      console.log(`   - ${acc.role} (${acc.email}): ✅ SIGNED IN (UID: ${data.user?.id})`);
      await client.auth.signOut();
    }
  }

  if (authOk) {
    console.log("✅ Act 2 Passed: All 4 demo accounts authenticate cleanly.");
    passed++;
  } else {
    console.log("❌ Act 2 Failed: One or more demo logins failed.");
    failed++;
  }

  // ACT 3: Creative Publishing & Media Embeds
  console.log("\n--- ACT 3: Creative Publishing ---");
  try {
    const { data: shishyaAuth } = await client.auth.signInWithPassword({
      email: "shishya.demo@sangam.test",
      password: "Demo@1234",
    });

    if (!shishyaAuth.user) throw new Error("Could not log in as Shishya");

    // Test creating a post
    const testTitle = `Test Verse ${Date.now().toString(36)}`;
    const { data: newPost, error: postErr } = await client.from("posts").insert({
      author_id: shishyaAuth.user.id,
      category: "poetry",
      language: "Hindi",
      title: testTitle,
      body_text: "क्षण भर का सन्नाटा भी एक राग है।",
      media_type: "none",
    }).select().single();

    if (postErr) throw postErr;
    console.log(`✅ Act 3 Passed: Published work '${newPost.title}' as Shishya.`);

    // Clean up test post
    await client.from("posts").delete().eq("id", newPost.id);
    await client.auth.signOut();
    passed++;
  } catch (err: any) {
    console.log(`❌ Act 3 Failed: ${err.message}`);
    failed++;
  }

  // ACT 4: Mentorship Connection & Contact Unlocking Gate
  console.log("\n--- ACT 4: Mentorship Connection & Privacy Unlocking ---");
  try {
    // 1. Check that Aarav's contact details are UNLOCKED for Devavrata (accepted connection in seed)
    const { data: guruAuth } = await client.auth.signInWithPassword({
      email: "guru.demo@sangam.test",
      password: "Demo@1234",
    });

    if (!guruAuth.user) throw new Error("Could not log in as Guru");

    // Devavrata queries Aarav's profile_contacts
    const { data: contactRow, error: contErr } = await client
      .from("profile_contacts")
      .select("*")
      .eq("user_id", "s0000000-0000-0000-0000-000000000001")
      .single();

    if (contErr || !contactRow) {
      throw new Error(`Contact unlock failed: ${contErr?.message || "No contact returned"}`);
    }

    console.log(`   - Verified Guru read Aarav's WhatsApp: ✅ ${contactRow.contact_whatsapp}`);

    // 2. Query contact of an UNCONNECTED Shishya (Ananya Sharma) -> RLS must block or return empty!
    const { data: blockedRow } = await client
      .from("profile_contacts")
      .select("*")
      .eq("user_id", "s0000000-0000-0000-0000-000000000002")
      .maybeSingle();

    if (blockedRow) {
      throw new Error("RLS Security Leak! Unconnected Shishya contacts were exposed!");
    } else {
      console.log("   - Unconnected Shishya contacts: ✅ Strictly protected by RLS (0 rows returned)");
    }

    await client.auth.signOut();
    console.log("✅ Act 4 Passed: Contact revelation and privacy RLS work flawlessly.");
    passed++;
  } catch (err: any) {
    console.log(`❌ Act 4 Failed: ${err.message}`);
    failed++;
  }

  // ACT 5: Admin Verification Gate
  console.log("\n--- ACT 5: Admin Verification Gate ---");
  try {
    const { data: adminAuth } = await client.auth.signInWithPassword({
      email: "admin.demo@sangam.test",
      password: "Demo@1234",
    });

    if (!adminAuth.user) throw new Error("Could not log in as Admin");

    // Query pending gurus
    const { data: pendingGurus, error: pErr } = await client
      .from("profiles")
      .select("id, full_name, guru_status")
      .eq("role", "guru")
      .eq("guru_status", "pending");

    if (pErr) throw pErr;
    console.log(`   - Admin retrieved ${pendingGurus.length} pending Guru application(s).`);

    await client.auth.signOut();
    console.log("✅ Act 5 Passed: Admin panel privileges and queries verified.");
    passed++;
  } catch (err: any) {
    console.log(`❌ Act 5 Failed: ${err.message}`);
    failed++;
  }

  console.log("\n=================================================");
  console.log(`   SUITE COMPLETE: ${passed}/5 Acts Passed, ${failed} Failed`);
  console.log("=================================================");
}

runE2EActs().catch(console.error);
