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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env.local.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resetDemo() {
  console.log("🔄 Resetting Sangam demo state to original pristine seed...\n");

  // 1. Reset Connections to original 4 rows
  console.log("1. Resetting Connections...");
  await supabaseAdmin.from("connections").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const originalConnections = [
    {
      id: "f0000000-0000-0000-0000-000000000001",
      guru_id: "b0000000-0000-0000-0000-000000000001",
      shishya_id: "c0000000-0000-0000-0000-000000000001",
      post_id: "d0000000-0000-0000-0000-000000000001",
      note: "आरव, मैंने आपकी “धूप के साये” कविता पढ़ी। आपकी आवाज़ में शास्त्रीय गहराई की संभावना है। मैं आपको छंद और शास्त्रीय गायकी के संगम का मार्गदर्शन देना चाहता हूँ।",
      status: "accepted",
    },
    {
      id: "f0000000-0000-0000-0000-000000000002",
      guru_id: "b0000000-0000-0000-0000-000000000002",
      shishya_id: "c0000000-0000-0000-0000-000000000003",
      post_id: "d0000000-0000-0000-0000-000000000004",
      note: "ಚೇತನ್ ಅವರೇ, ನಿಮ್ಮ ವಚನ ಗಾಯನವನ್ನು ಕೇಳಿದೆ. ಭಾವಗೀತೆಗಳಲ್ಲಿ ರಾಗ ಸಂಯೋಜನೆ ಮಾಡಲು ನಾನು ನಿಮಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡಬಯಸುತ್ತೇನೆ.",
      status: "pending",
    },
    {
      id: "f0000000-0000-0000-0000-000000000003",
      guru_id: "b0000000-0000-0000-0000-000000000003",
      shishya_id: "c0000000-0000-0000-0000-000000000001",
      post_id: "d0000000-0000-0000-0000-000000000002",
      note: "Aarav, your acoustic guitar arrangement of Raag Bhairavi has soulful touch. I would like to mentor your phrasing.",
      status: "pending",
    },
    {
      id: "f0000000-0000-0000-0000-000000000004",
      guru_id: "b0000000-0000-0000-0000-000000000004",
      shishya_id: "c0000000-0000-0000-0000-000000000004",
      post_id: "d0000000-0000-0000-0000-000000000006",
      note: "I enjoyed your poem Tanya, wishing you all the best.",
      status: "rejected",
    },
  ];

  for (const conn of originalConnections) {
    await supabaseAdmin.from("connections").upsert(conn);
  }
  console.log("   ✅ Connections restored.");

  // 2. Reset Pending Guru back to 'pending' / unverified
  console.log("\n2. Resetting Pending Guru (Tarun Sengupta)...");
  await supabaseAdmin
    .from("profiles")
    .update({
      guru_status: "pending",
      is_verified: false,
    })
    .eq("id", "b0000000-0000-0000-0000-000000000006");
  console.log("   ✅ Pending Guru reset to 'pending' (is_verified = false).");

  // 3. Reset Verified Guru (Devavrata Shastri)
  await supabaseAdmin
    .from("profiles")
    .update({
      guru_status: "approved",
      is_verified: true,
    })
    .eq("id", "b0000000-0000-0000-0000-000000000001");
  console.log("   ✅ Verified Guru reset to 'approved' (is_verified = true).");

  // 4. Reset Notifications to original state
  console.log("\n3. Resetting Notifications...");
  await supabaseAdmin.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const originalNotifications = [
    {
      id: "a1000000-0000-0000-0000-000000000001",
      user_id: "c0000000-0000-0000-0000-000000000001",
      actor_id: "b0000000-0000-0000-0000-000000000001",
      type: "like",
      post_id: "d0000000-0000-0000-0000-000000000001",
      connection_id: null,
      is_read: true,
    },
    {
      id: "a1000000-0000-0000-0000-000000000002",
      user_id: "c0000000-0000-0000-0000-000000000001",
      actor_id: "b0000000-0000-0000-0000-000000000001",
      type: "comment",
      post_id: "d0000000-0000-0000-0000-000000000001",
      connection_id: null,
      is_read: true,
    },
    {
      id: "a1000000-0000-0000-0000-000000000003",
      user_id: "c0000000-0000-0000-0000-000000000001",
      actor_id: "b0000000-0000-0000-0000-000000000001",
      type: "connect_request",
      post_id: null,
      connection_id: "f0000000-0000-0000-0000-000000000001",
      is_read: true,
    },
    {
      id: "a1000000-0000-0000-0000-000000000004",
      user_id: "b0000000-0000-0000-0000-000000000001",
      actor_id: "c0000000-0000-0000-0000-000000000001",
      type: "connect_accepted",
      post_id: null,
      connection_id: "f0000000-0000-0000-0000-000000000001",
      is_read: true,
    },
    {
      id: "a1000000-0000-0000-0000-000000000005",
      user_id: "c0000000-0000-0000-0000-000000000001",
      actor_id: "b0000000-0000-0000-0000-000000000003",
      type: "connect_request",
      post_id: null,
      connection_id: "f0000000-0000-0000-0000-000000000003",
      is_read: false,
    },
    {
      id: "a1000000-0000-0000-0000-000000000006",
      user_id: "b0000000-0000-0000-0000-000000000001",
      actor_id: "a0000000-0000-0000-0000-000000000001",
      type: "guru_approved",
      post_id: null,
      connection_id: null,
      is_read: true,
    },
  ];

  for (const n of originalNotifications) {
    await supabaseAdmin.from("notifications").upsert(n as any);
  }
  console.log("   ✅ Notifications restored (including pending connect request for Shishya Demo).");

  // 5. Clean test comments/likes on post 1
  console.log("\n4. Resetting interactions on original posts...");
  await supabaseAdmin.from("comments").delete().neq("id", "e0000000-0000-0000-0000-000000000001")
    .neq("id", "e0000000-0000-0000-0000-000000000002")
    .neq("id", "e0000000-0000-0000-0000-000000000003");

  console.log("\n✨ SANGAM DEMO RESET COMPLETE!");
  console.log("The database is now in its exact, pristine demo state for presentation.");
}

resetDemo().catch(console.error);
