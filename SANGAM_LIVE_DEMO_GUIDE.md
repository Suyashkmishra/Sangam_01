# Sangam (संगम) — Live College Demo Presentation Guide

**Tagline**: *Sacred Ink meets Digital Soul*  
**Platform**: Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase SSR & PostgreSQL  

---

## 🎭 Demo Accounts Reference (All password: `Demo@1234`)

| Role | Email | Password | Key Feature to Demo |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin.demo@sangam.test` | `Demo@1234` | Curatorial Guru verification, lineage management |
| **Verified Guru** | `guru.demo@sangam.test` | `Demo@1234` | Verified Guru badge, sending mentorship notes, viewing unlocked contact line |
| **Young Shishya** | `shishya.demo@sangam.test` | `Demo@1234` | Publishing poetry & music, accepting mentorship, private contact sharing |
| **Pending Guru** | `pending.guru@sangam.test` | `Demo@1234` | "Awaiting approval" banner, restricted mentorship connections |

> **Presentation Tip**: On the `/login` page, click any of the **1-Click Demo Buttons** at the top of the card to instantly autofill credentials!

---

## 🚀 Live Demo Walkthrough (5-Minute Presentation Script)

### Act 1: The Cultural Vision & Aesthetic (1 min)
1. Open `http://localhost:3000/`.
2. Point out the authentic Indian warm aesthetic:
   - Cream background (`#F6EDE0`), deep Espresso text (`#2A1A12`), Copper accents (`#B8622E`), and Antique Gold highlights (`#A8751F`).
   - Cormorant Garamond serif headings, Outfit sans body, and native Devanagari & Kannada script support.
   - Flowing confluence logo emblem in `public/logo.svg`.
3. Click **Pricing**:
   - Highlight the cultural stewardship fees: ₹60 one-time for Shishya, ₹200/month for Guru.
   - Point out the clear "College Live Demo — Simulated Transactions" disclosure.

### Act 2: Role Selection & Mock Fee Payment (1 min)
1. Click **Join as Young Talent (Shishya)** &rarr; `/signup`.
2. Show that users can choose between **Shishya** (₹60) and **Guru** (₹200). Note that `admin` is strictly excluded from self-registration.
3. Complete registration to reach `/checkout`:
   - Toggle between **Instant UPI** (with handle shortcuts like `@okhdfcbank`, `@paytm`) and **Card**.
   - Click **Complete Demo Payment**: observe the simulated bank authorization spinner and receipt generation (`TXN_SANGAM_...`).
   - Explain that a record is securely audited in the PostgreSQL `payments` table.

### Act 3: Exploration & Creative Publishing (1 min)
1. Go to `/explore`:
   - Filter by **Form**: Poetry vs. Music.
   - Filter by **Language**: Hindi, Kannada, English.
   - Switch tabs between **All Works**, **Gurus**, and **Shishyas**.
2. Click **Create Post** (`/posts/create`):
   - Show how changing the language dynamically switches the typography class (`font-devanagari` vs `font-kannada`).
   - Show the file upload limits (Audio &le; 10 MB, Video &le; 50 MB) and live embed preview for YouTube / Instagram links.

### Act 4: The Mentorship Connection & Contact Unlocking Flow (1.5 min)
1. **Sign in as Verified Guru** (`guru.demo@sangam.test`):
   - Notice the golden **Verified Guru** badge on navbar and profile.
   - Open a Shishya's post (e.g. *Aarav Neelkanth's* "धूप के साये").
   - Click **Connect with Shishya**, enter a mentor note, and submit.
   - Point out: *The Shishya's phone/email is NOT visible yet.*
2. **Sign in as Shishya** (`shishya.demo@sangam.test`):
   - Notice the pulsing red badge on the **Notification Bell** &rarr; `/notifications`.
   - Read the Guru's invitation note.
   - Click **Accept & Reveal Contact Line**!
3. **Switch back to Guru** (`guru.demo@sangam.test`):
   - Visit the accepted Shishya's public profile (`/profile/...`).
   - **Showcase the Reveal**: The locked padlock is replaced with the green **Unlocked Mentorship Contact Line**, displaying their direct WhatsApp button (`wa.me/...`), Instagram handle, and verified email!
   - Explain the technical architecture: *This data lives in an isolated table (`profile_contacts`) and is protected by PostgreSQL Row-Level Security — no client query could read it until the connection record became `accepted`.*

### Act 5: Administrative Guru Approval Gate (30 sec)
1. Sign in as **Admin** (`admin.demo@sangam.test`).
2. Go to `/admin` (accessible via navbar dropdown):
   - View pending applicant **Tarun Sengupta**.
   - Click **Approve as Verified Guru**.
   - Show that the applicant is instantly verified, granted the badge, and notified via an automated database trigger!

---

## 🛡️ Technical Talking Points for Evaluators
- **Row-Level Security (RLS)**: Enforced across all 8 tables. Not a single query bypasses RLS on the client.
- **Trigger-Enforced Immutability**: Normal users cannot alter their role, verification status, or guru approval status — attempting to do so triggers a PostgreSQL exception.
- **Client-Protected Notifications**: Clients cannot insert fake notifications (`WITH CHECK (false)`); notifications are emitted exclusively by PostgreSQL triggers on `likes`, `comments`, `connections`, and `profiles`.
- **Media Quotas**: Storage policies enforce 10 MB audio, 50 MB video, and strict folder ownership matching `auth.uid()`.

