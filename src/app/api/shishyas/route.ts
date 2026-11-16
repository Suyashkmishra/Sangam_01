import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
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
        // ignore
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in." },
        { status: 401 }
      );
    }

    // Check caller profile
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Strict rule: Shishyas are NOT permitted to list fellow shishyas
    if (!callerProfile || callerProfile.role === "shishya") {
      return NextResponse.json(
        { error: "Forbidden: Shishyas are not permitted to list fellow shishyas." },
        { status: 403 }
      );
    }

    // Only Gurus and Admins can list Shishyas
    const { data: shishyas, error } = await adminClient
      .from("profiles")
      .select("*")
      .eq("role", "shishya")
      .eq("is_suspended", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ shishyas: shishyas || [] });
  } catch (err: any) {
    console.error("Shishyas list error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to list shishyas" },
      { status: 500 }
    );
  }
}
