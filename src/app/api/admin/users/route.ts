import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getAuthenticatedAdmin(request: NextRequest) {
  const adminClient = createAdminClient();
  let user = null;

  // 1. Try Authorization header
  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const { data } = await adminClient.auth.getUser(token);
    user = data.user;
  }

  // 2. Try cookie session
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

  // Check admin role
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
    const { data: users, error } = await adminClient
      .from("profiles")
      .select("id, full_name, role, city, guru_status, is_verified, is_suspended, suspended_at, created_at, avatar_url")
      .neq("role", "admin")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (err: any) {
    console.error("Admin users GET error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAuthenticatedAdmin(request);
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action, reason } = body;

    if (!userId || !["suspend", "reactivate", "guru_approve", "guru_reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    // Rule 1: Admins cannot suspend themselves
    if (userId === adminUser.id) {
      return NextResponse.json({ error: "Admins cannot modify their own status here" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Rule 2: Check target user - Admins cannot suspend another admin
    const { data: targetProfile, error: targetErr } = await adminClient
      .from("profiles")
      .select("id, full_name, role, is_suspended, guru_status, is_verified")
      .eq("id", userId)
      .single();

    if (targetErr || !targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetProfile.role === "admin") {
      return NextResponse.json({ error: "Admins cannot modify another admin" }, { status: 403 });
    }

    // Handle Guru Approval / Rejection
    if (action === "guru_approve" || action === "guru_reject") {
      const isApproved = action === "guru_approve";
      const newStatus = isApproved ? "approved" : "rejected";

      const { data: updatedProfile, error: updateErr } = await adminClient
        .from("profiles")
        .update({
          guru_status: newStatus,
          is_verified: isApproved,
        })
        .eq("id", userId)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Record in admin_actions
      try {
        await adminClient.from("admin_actions").insert({
          admin_id: adminUser.id,
          action: isApproved ? "guru_approved" : "guru_rejected",
          target_type: "guru",
          target_id: userId,
          target_name: targetProfile.full_name,
          reason: reason || (isApproved ? "Approved by curator" : "Did not meet verification criteria"),
        });
      } catch (logErr) {
        console.warn("admin_actions insert notice:", logErr);
      }

      // Notify Guru
      try {
        await adminClient.from("notifications").insert({
          user_id: userId,
          actor_id: adminUser.id,
          type: isApproved ? "guru_approved" : "guru_rejected",
          message: isApproved
            ? "Your application for Guru mentorship has been approved. You are now a Verified Guru on Sangam."
            : `Your application for Guru mentorship was not approved. Reason: ${reason || "Did not meet lineage verification criteria."}`,
        });
      } catch (notifErr) {
        console.warn("Notification insert notice:", notifErr);
      }

      return NextResponse.json({
        success: true,
        message: isApproved
          ? `Guru application for ${targetProfile.full_name} approved.`
          : `Guru application for ${targetProfile.full_name} rejected.`,
        profile: updatedProfile,
      });
    }

    const isSuspending = action === "suspend";

    // 1. Update profiles table with suspension flag and timestamp
    const { data: updatedProfile, error: updateErr } = await adminClient
      .from("profiles")
      .update({
        is_suspended: isSuspending,
        suspended_at: isSuspending ? new Date().toISOString() : null,
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 2. Record in admin_actions
    try {
      await adminClient.from("admin_actions").insert({
        admin_id: adminUser.id,
        action: isSuspending ? "user_suspended" : "user_reactivated",
        target_type: "user",
        target_id: userId,
        target_name: targetProfile.full_name,
        reason: reason || (isSuspending ? "Violated community guidelines" : "Reactivated by admin"),
      });
    } catch (logErr) {
      console.warn("admin_actions insert notice:", logErr);
    }

    // 3. Update Supabase Auth ban status so credentials fail at auth level
    try {
      await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: isSuspending ? "876000h" : "none",
      });
    } catch (authBanErr) {
      console.warn("Auth ban update warning (profile suspension is primary):", authBanErr);
    }

    return NextResponse.json({
      success: true,
      message: isSuspending 
        ? `${targetProfile.full_name} has been suspended and removed from public listings.`
        : `${targetProfile.full_name} has been reactivated.`,
      profile: updatedProfile,
    });
  } catch (err: any) {
    console.error("Admin user action error:", err);
    return NextResponse.json({ error: err.message || "Failed to process request" }, { status: 500 });
  }
}
