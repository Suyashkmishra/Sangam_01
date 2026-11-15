# Sangam (संगम) — Phase 1 & Phase 2 Completion Report

**Project**: Sangam (संगम)  
**Tagline**: *Sacred Ink meets Digital Soul*  
**Date**: November 15, 2026  
**Status**: Phase 1 & Phase 2 Completed & Verified  

---

## 1. Executive Summary

Sangam is a full-stack cultural platform designed to connect young, emerging poets and musicians (*Shishya*) with established, legendary artists (*Guru*). 

This report documents the completion of **Phase 1** (Project Setup, Custom Design System & Responsive Layout) and **Phase 2** (Database Schema, PostgreSQL Triggers, Row-Level Security, Storage Buckets, and Multilingual Seed Automation).

---

## 2. Phase 1: Project Setup & Design System

### 2.1 Pinned Tech Stack
- **Framework**: Next.js 14 (`v14.2.23`) with App Router and TypeScript (`v5.7.3`).
- **Styling**: Tailwind CSS (`v3.4.17`) with custom configuration.
- **Backend & SSR**: `@supabase/ssr` (`v0.5.2`) and `@supabase/supabase-js` (`v2.48.1`).
- **Icons & Tooling**: `lucide-react` (`v0.475.0`), `tsx` runner for seed automation.

### 2.2 Cultural Theme & Color Tokens
Custom color scheme configured in `tailwind.config.ts` and `src/app/globals.css`:
- **Cream Background** (`#F6EDE0`): Warm, paper-like background.
- **Espresso Text** (`#2A1A12`): Deep earthy brown for typography.
- **Copper Accent** (`#B8622E`): Terracotta/copper tone for primary buttons, tags, and borders.
- **Antique Gold** (`#A8751F`): Used exclusively for the italic hero keyword highlight.
- **Parchment Surfaces** (`#FCF8F2` / `#FAF5EE`): Subtle warm card backgrounds with soft borders (`#E9DAC9`).

### 2.3 Typography & Script Support
Integrated via Google Fonts with zero-latency fallback:
- **Headings**: `Cormorant Garamond` (Classical serif).
- **Body**: `Outfit` (Modern, readable geometric sans-serif).
- **Hindi / Devanagari**: `Noto Sans Devanagari` (for ghazals, kavita, dohas).
- **Kannada**: `Noto Sans Kannada` (for vachanas, bhavageethe).

### 2.4 Brand Assets
- **Logo Emblem** (`public/logo.svg`): Created an SVG combining a flowing confluence motif (sacred river meets ink stream), veena sound node, antique gold drop, and dual typography ("SANGAM" + "संगम").

### 2.5 Landing Page & Navigation
- Created `src/app/page.tsx` featuring:
  - Top navigation bar with logo, navigation links, and auth CTAs.
  - Hero section with pill badge: `✦ CONFLUENCE OF POETIC AND MUSICAL SOULS ✦`.
  - Main headline: *Where Young Voices Find Their* ***Guru***.
  - Call-to-actions for **Young Talent (Shishya)** and **Guru / Mentor**.
  - Thin curved ornamental motifs in copper and antique gold.

---

## 3. Phase 2: Database Schema, RLS & Storage

### 3.1 PostgreSQL Schema (`supabase/migrations/001_initial_schema.sql`)
1. **`profiles`**:
   - Fields: `id` (references `auth.users`), `role` (`shishya`, `guru`, `admin`), `full_name`, `bio`, `city`, `languages`, `avatar_url`, `guru_status` (`none`, `pending`, `approved`, `rejected`), `is_verified`, `created_at`.
2. **`profile_contacts` (Separated for Privacy)**:
   - Fields: `user_id` (PK), `contact_whatsapp`, `contact_instagram`, `contact_email`, `preferred_channel` (`whatsapp`, `instagram`, `email`), `created_at`.
3. **`posts`**:
   - Fields: `id`, `author_id`, `category` (`poetry`, `music`), `language` (`Hindi`, `English`, `Kannada`), `title`, `body_text`, `media_url`, `media_type` (`video`, `audio`, `none`), `external_link`, `created_at`.
4. **`likes`**:
   - Composite PK: `(post_id, user_id)`, `created_at`.
5. **`comments`**:
   - Fields: `id`, `post_id`, `user_id`, `body`, `created_at`.
6. **`connections`**:
   - Fields: `id`, `guru_id`, `shishya_id`, `post_id`, `note`, `status` (`pending`, `accepted`, `rejected`), `created_at`.
7. **`notifications`**:
   - Fields: `id`, `user_id` (recipient), `actor_id` (initiator), `type`, `post_id`, `connection_id`, `is_read`, `created_at`.
8. **`payments`**:
   - Fields: `id`, `user_id`, `amount`, `plan` (`shishya_onetime`, `guru_monthly`), `status` (`paid`, `failed`, `pending`), `mock` (`true`), `created_at`.

### 3.2 Security, RLS & PostgreSQL Triggers

| Security Mechanism | Implementation | Purpose |
| :--- | :--- | :--- |
| **Contact Privacy Gate** | RLS on `profile_contacts` | Contact details are **only** visible to the user themselves or an approved Guru who has an **accepted** connection request with that Shishya. |
| **Privilege Modification Lock** | `prevent_unauthorized_profile_updates()` trigger | Blocks any user from updating their own `role`, `is_verified`, or `guru_status`. Only admins and service roles can modify these fields. |
| **Signup Escalation Block** | `handle_new_user()` trigger | Intercepts new signups; if a user attempts to sign up with `role='admin'`, it is forcibly overridden to `role='shishya'`. |
| **Database-Driven Notifications** | DB triggers on `likes`, `comments`, `connections`, `profiles` | Direct client inserts to `notifications` are blocked (`WITH CHECK (false)`). All notifications are generated securely on the database level. |
| **Guru Connection Guard** | RLS on `connections` | Only Gurus with `role = 'guru'` **AND** `is_verified = true` can insert connection requests. |
| **Storage Upload Ownership** | RLS on `storage.objects` | Directs uploads strictly into folders matching `auth.uid()/*`. |
| **Storage File Size Quotas** | Supabase Storage configuration | Audio uploads capped at **10 MB**, Video at **50 MB**, and Avatars at **2 MB**. |

---

## 4. Seed Data & Automation (`supabase/seed.sql` & `scripts/seed-users.ts`)

### 4.1 Demo Accounts Matrix
All demo accounts are configured with password **`Demo@1234`**:
- **Admin**: `admin.demo@sangam.test` (Sangam Peethadhish, Admin Curator)
- **Verified Guru**: `guru.demo@sangam.test` (Pandit Devavrata Shastri, Classical Dhrupad & Hindi Poetry)
- **Shishya**: `shishya.demo@sangam.test` (Aarav Neelkanth, Emerging Hindi poet & acoustic guitarist)
- **Pending Guru**: `pending.guru@sangam.test` (Tarun Sengupta, Awaiting admin verification)

### 4.2 Seed Content Overview
- **Artists**: 5 approved verified Gurus, 1 pending Guru, and 10 emerging Shishyas (all fictional names).
- **20 Multilingual Posts**:
  - Hindi poetry (ghazals, kavita in Devanagari script).
  - Kannada poetry (vachana, bhavageethe in Kannada script).
  - English poetry and indie acoustic compositions.
  - Realistic audio links, video embeds, and YouTube links.
- **Seeded Interactions**:
  - Likes and comments on foundational posts.
  - Connections in all three states:
    1. **Accepted** (Guru Demo + Shishya Demo, enabling immediate testing of unlocked contact info).
    2. **Pending** (Pending connection on Shishya Demo to test the Accept/Reject buttons live).
    3. **Rejected** (Historical record).
  - Mock payments for Shishya (₹60) and Gurus (₹200).

---

## 5. Client & Server Architecture

- **`src/lib/supabase/client.ts`**: Browser Supabase client via `createBrowserClient()`.
- **`src/lib/supabase/server.ts`**: Server Component and Server Action client via `createServerClient()` with Next.js cookie handling.
- **`src/lib/supabase/middleware.ts` & `src/middleware.ts`**: Edge middleware refreshing auth sessions automatically across all non-static routes.
- **`src/lib/supabase/admin.ts`**: Privileged service-role client for background/admin workflows.
- **`src/lib/types/database.types.ts`**: Full TypeScript definitions for tables, relations, and enums.
- **Security Hygiene**: `.gitignore` strictly protects `.env.local` and service role secrets. `.env.example` provided for project onboarding.

---

## 6. Verification & Build Status

- **Build Check**: Ran `npm run build` — compiled with **0 errors** across all static pages, types, and middleware.
- **Server Runtime Check**: Production server started and responded with **HTTP 200 OK** at `http://localhost:3000`.
- **Database Assets**: Ready for execution via Supabase SQL Editor and `npm run seed`.

---

## 7. Next Roadmap: Phase 3 & Phase 4

- **Phase 3**: Authentication (Email + Password), Role Selection (`shishya` vs `guru`), Mock Payment Modal (Card & UPI with simulated fee collection), and Pending Guru approval gating banner.
- **Phase 4**: Post Creation (Poetry / Music with storage upload or YouTube embed), Explore feed with filters (Category, Language, Gurus vs Shishyas), and Post Detail with likes and comments.

