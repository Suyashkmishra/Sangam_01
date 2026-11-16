import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify caller is admin
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const adminClient = createAdminClient();
    const { data: users, error } = await adminClient
      .from("profiles")
      .select("id, full_name, role, city, guru_status, is_verified, is_suspended, suspended_at, created_at")
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
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Please sign in" }, { status: 401 });
    }

    // Verify caller has admin role
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !["suspend", "reactivate"].includes(action)) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    // Rule 1: Admins cannot suspend themselves
    if (userId === user.id) {
      return NextResponse.json({ error: "Admins cannot suspend themselves" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Rule 2: Check target user - Admins cannot suspend another admin
    const { data: targetProfile, error: targetErr } = await adminClient
      .from("profiles")
      .select("id, full_name, role, is_suspended")
      .eq("id", userId)
      .single();

    if (targetErr || !targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetProfile.role === "admin") {
      return NextResponse.json({ error: "Admins cannot suspend another admin" }, { status: 403 });
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

    // 2. Update Supabase Auth ban status so credentials fail at auth level
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
        ? `${targetProfile.full_name} has been suspended.`
        : `${targetProfile.full_name} has been reactivated.`,
      profile: updatedProfile,
    });
  } catch (err: any) {
    console.error("Admin user action error:", err);
    return NextResponse.json({ error: err.message || "Failed to process request" }, { status: 500 });
  }
}
