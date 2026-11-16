import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Manually parse .env.local if present
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local to seed auth users.");
  console.log("Usage: Add your credentials to .env.local and run: npm run seed");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface DemoUser {
  id: string;
  email: string;
  password: string;
  role: "admin" | "guru" | "shishya";
  full_name: string;
}

const DEMO_USERS: DemoUser[] = [
  // 1 Admin
  {
    id: "a0000000-0000-0000-0000-000000000001",
    email: "admin.demo@sangam.test",
    password: "Demo@1234",
    role: "admin",
    full_name: "Sangam Admin",
  },
  // 5 Approved Verified Gurus
  {
    id: "b0000000-0000-0000-0000-000000000001",
    email: "guru.demo@sangam.test",
    password: "Demo@1234",
    role: "guru",
    full_name: "Pandit Devavrata Shastri",
  },
  {
    id: "b0000000-0000-0000-0000-000000000002",
    email: "malavika.guru@sangam.test",
    password: "Demo@1234",
    role: "guru",
    full_name: "Vidushi Malavika Sundaram",
  },
  {
    id: "b0000000-0000-0000-0000-000000000003",
    email: "zeeshan.guru@sangam.test",
    password: "Demo@1234",
    role: "guru",
    full_name: "Ustad Zeeshan Farooqui",
  },
  {
    id: "b0000000-0000-0000-0000-000000000004",
    email: "someshwar.guru@sangam.test",
    password: "Demo@1234",
    role: "guru",
    full_name: "Acharya Someshwar Bhat",
  },
  {
    id: "b0000000-0000-0000-0000-000000000005",
    email: "evelyn.guru@sangam.test",
    password: "Demo@1234",
    role: "guru",
    full_name: "Dr. Evelyn Roy",
  },
  // 1 Pending Guru
  {
    id: "b0000000-0000-0000-0000-000000000006",
    email: "pending.guru@sangam.test",
    password: "Demo@1234",
    role: "guru",
    full_name: "Tarun Sengupta",
  },
  // 10 Emerging Shishyas
  {
    id: "c0000000-0000-0000-0000-000000000001",
    email: "shishya.demo@sangam.test",
    password: "Demo@1234",
    role: "shishya",
    full_name: "Aarav Neelkanth",
  },
  {
    id: "c0000000-0000-0000-0000-000000000002",
    email: "ananya.sharma@sangam.test",
    password: "Demo@1234",
    role: "shishya",
    full_name: "Ananya Sharma",
  },
  {
    id: "c0000000-0000-0000-0000-000000000003",
    email: "chetan.kumar@sangam.test",
    password: "Demo@1234",
    role: "shishya",
    full_name: "Chetan Kumar",
  },
  {
    id: "c0000000-0000-0000-0000-000000000004",
    email: "tanya.m@sangam.test",
    password: "Demo@1234",
    role: "shishya",
    full_name: "Tanya Mukherjee",
  },
  {
    id: "c0000000-0000-0000-0000-000000000005",
    email: "kabir.varma@sangam.test",
    password: "Demo@1234",
    role: "shishya",
    full_name: "Kabir Varma",
  },
  {
    id: "c0000000-0000-0000-0000-000000000006",
    email: "lavanya.rao@sangam.test",
    password: "Demo@1234",
    role: "shishya",
    full_name: "Lavanya Rao",
  },
  {
    id: "c0000000-0000-0000-0000-000000000007",
    email: "nikhil.d@sangam.test",
    password: "Demo@1234",
    role: "shishya",
    full_name: "Nikhil D’Souza",
  },
  {
    id: "c0000000-0000-0000-0000-000000000008",
    email: "meera.c@sangam.test",
    password: "Demo@1234",
    role: "shishya",
    full_name: "Meera Chandran",
  },
  {
    id: "c0000000-0000-0000-0000-000000000009",
    email: "vignesh.h@sangam.test",
    password: "Demo@1234",
    role: "shishya",
    full_name: "Vignesh Hegde",
  },
  {
    id: "c0000000-0000-0000-0000-000000000010",
    email: "riya.saxena@sangam.test",
    password: "Demo@1234",
    role: "shishya",
    full_name: "Riya Saxena",
  },
];

async function seedAuthUsers() {
  console.log("🕊️ Sangam Auth User Provisioning starting...");

  for (const user of DEMO_USERS) {
    try {
      // Check if user exists
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(user.id);

      if (existingUser?.user) {
        console.log(`ℹ️ User ${user.email} already exists (ID: ${user.id}). Updating password & metadata...`);
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: user.password,
          user_metadata: {
            full_name: user.full_name,
            role: user.role,
          },
          email_confirm: true,
        });
      } else {
        console.log(`✨ Creating user ${user.email}...`);
        const { error } = await supabaseAdmin.auth.admin.createUser({
          id: user.id,
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
            role: user.role,
          },
        });

        if (error) {
          console.error(`❌ Failed to create ${user.email}:`, error.message);
        } else {
          console.log(`✅ Created ${user.email} successfully.`);
        }
      }
    } catch (err) {
      console.error(`Error processing ${user.email}:`, err);
    }
  }

  console.log("\n🎉 Auth users provisioning completed!");
  console.log("Demo Credentials:");
  console.log("-----------------------------------------");
  console.log("Admin:   admin.demo@sangam.test   / Demo@1234");
  console.log("Guru:    guru.demo@sangam.test    / Demo@1234");
  console.log("Shishya: shishya.demo@sangam.test / Demo@1234");
  console.log("-----------------------------------------");
}

seedAuthUsers().catch(console.error);

