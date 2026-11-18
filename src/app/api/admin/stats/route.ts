import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getAuthenticatedAdmin(request: NextRequest) {
  const adminClient = createAdminClient();
  let user = null;

  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const { data } = await adminClient.auth.getUser(token);
    user = data.user;
  }

  if (!user) {
    try {
      const supabase = createServerSupabase();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (e) {
      // Fallback
    }
  }

  if (!user) return null;

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAuthenticatedAdmin(request);
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // 1. Total Gurus
    const { count: totalGurus } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "guru");

    // 2. Total Shishyas
    const { count: totalShishyas } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "shishya");

    // 3. Total Posts
    const { count: totalPosts } = await adminClient
      .from("posts")
      .select("*", { count: "exact", head: true });

    // 4. Pending Gurus
    const { count: pendingGurus } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("guru_status", "pending");

    // 5. Suspended Users
    const { count: suspendedUsers } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_suspended", true);

    // 6. Posts Under Review
    const { count: postsUnderReview } = await adminClient
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review");

    // Latest 5 Signups
    const { data: latestSignups } = await adminClient
      .from("profiles")
      .select("id, full_name, role, city, created_at, avatar_url, guru_status")
      .neq("role", "admin")
      .order("created_at", { ascending: false })
      .limit(5);

    // Latest 5 Posts
    const { data: latestPosts } = await adminClient
      .from("posts")
      .select("id, title, category, language, status, created_at, author:profiles!posts_author_id_fkey(id, full_name, role, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(5);

    // Latest 5 Admin Actions
    const { data: latestActions } = await adminClient
      .from("admin_actions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      stats: {
        totalGurus: totalGurus || 0,
        totalShishyas: totalShishyas || 0,
        totalPosts: totalPosts || 0,
        pendingGurus: pendingGurus || 0,
        suspendedUsers: suspendedUsers || 0,
        postsUnderReview: postsUnderReview || 0,
      },
      activity: {
        latestSignups: latestSignups || [],
        latestPosts: latestPosts || [],
        latestActions: latestActions || [],
      },
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (err: any) {
    console.error("Admin stats GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch stats" }, { status: 500 });
  }
}
