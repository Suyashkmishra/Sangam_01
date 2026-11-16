# Sangam (संगम) — Sacred Ink meets Digital Soul

A full-stack sanctuary bridging emerging young poets and musicians (*Shishya*) with established legendary mentors (*Guru*).

---

## 🌟 Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS with custom Indian warm aesthetic (Cream `#F6EDE0`, Espresso `#2A1A12`, Copper `#B8622E`, Antique Gold `#A8751F`)
- **Typography**: Cormorant Garamond (Serif), Outfit (Sans), Noto Sans Devanagari, Noto Sans Kannada
- **Backend & Auth**: Supabase (@supabase/ssr) with PostgreSQL, Row Level Security (RLS) on all tables, and Supabase Storage
- **Payments**: Mock payment gateway with transactional receipts (₹60 one-time for Shishya, ₹200/mo for Guru)

---

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js 18+ (tested on Node 20 & 26)
- A free [Supabase](https://supabase.com) account

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials in `.env.local`:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Strictly kept in .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Security Note**: `SUPABASE_SERVICE_ROLE_KEY` is strictly listed in `.gitignore` and is never bundled with client code.

### 3. Run Database Migrations & Seed Data
In your Supabase project's **SQL Editor**:
1. Run the schema file: [supabase/migrations/001_initial_schema.sql](./supabase/migrations/001_initial_schema.sql)
2. Run the seed data file: [supabase/seed.sql](./supabase/seed.sql)

### 4. Provision Demo Auth Users
Run the user seeding script to create the 3 primary demo accounts in Supabase Auth:
```bash
npm run seed
```

### 5. Launch the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view Sangam.

---

## 🎭 Demo Credentials

| Role | Email | Password | Status |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin.demo@sangam.test` | `Demo@1234` | Admin (Verification & Management) |
| **Guru (Verified)** | `guru.demo@sangam.test` | `Demo@1234` | Pandit Devavrata Shastri (Classical Dhrupad & Poetry) |
| **Shishya (Talent)** | `shishya.demo@sangam.test` | `Demo@1234` | Aarav Neelkanth (Young Hindi poet & guitarist) |
| **Guru (Pending)** | `pending.guru@sangam.test` | `Demo@1234` | Tarun Sengupta (Awaiting admin approval) |

---

## 🔒 Security Architecture Highlights
1. **Separated Contact Privacy (`profile_contacts`)**: Shishya WhatsApp, Instagram, and email are locked behind RLS and are *only* accessible to the owner or an approved Guru whose connection request has been **accepted** by that Shishya.
2. **Role & Privilege Protection**: Users cannot escalate themselves to `admin` or mark themselves `is_verified`. Privilege changes are blocked via PostgreSQL triggers.
3. **Database-Driven Notifications**: Client code cannot forge notifications. Notifications are generated strictly by database triggers (`likes`, `comments`, `connections`, `profiles`).
4. **Storage Policies**: Audio uploads are capped at 10 MB, video at 50 MB, avatars at 2 MB, and users can only write to their own folder paths (`auth.uid()/*`).

