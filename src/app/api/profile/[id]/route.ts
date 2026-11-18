import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function getCallerProfile(request: NextRequest) {
  const adminClient = createAdminClient();
  let user = null;

  // 1. Try Authorization header
  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const { data, error } = await adminClient.auth.getUser(token);
    if (error) console.error("getUser error with token:", error.message);
    user = data?.user;
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

  if (!user) return null;

  const { data: profile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profileId = params.id;
    if (!profileId) {
      return NextResponse.json({ error: "Missing profile ID" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const caller = await getCallerProfile(request);

    // Fetch target profile
    const { data: targetProfile, error: targetErr } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (targetErr || !targetProfile || targetProfile.is_suspended) {
      return NextResponse.json(
        { error: "Artist not found or account is suspended." },
        { status: 404 }
      );
    }

    // Role-based field sanitization
    let sanitizedProfile = { ...targetProfile };

    if (targetProfile.role === "shishya") {
      const isPrivilegedCaller =
        caller?.role === "admin" ||
        caller?.role === "guru" ||
        caller?.id === targetProfile.id;

      if (!isPrivilegedCaller) {
        // Shishya viewer (or guest) viewing another shishya:
        // Returns ONLY initial avatar, name, and works. No bio, no city, no contact details.
        sanitizedProfile = {
          id: targetProfile.id,
          full_name: targetProfile.full_name,
          role: targetProfile.role,
          avatar_url: targetProfile.avatar_url,
          is_verified: targetProfile.is_verified,
          guru_status: targetProfile.guru_status,
          city: null,
          bio: null,
          languages: null,
          is_suspended: false,
          created_at: targetProfile.created_at,
          suspended_at: null,
        };
      }
    }

    // Fetch author's works (poetry and music)
    const { data: rawPosts, error: postsErr } = await adminClient
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*), likes(count), comments(count)")
      .eq("author_id", targetProfile.id)
      .order("created_at", { ascending: false });

    if (postsErr) {
      console.error("Error fetching works for profile:", postsErr);
    }

    const isAuthorOrAdmin = caller?.id === targetProfile.id || caller?.role === "admin";
    const formattedPosts = (rawPosts || [])
      .filter((p: any) => {
        // Author or Admin can view their own suspended or pending review posts
        if (isAuthorOrAdmin) return true;
        // Public viewers see only published posts
        return p.status === "published";
      })
      .map((p: any) => ({
        ...p,
        likes_count: p.likes?.[0]?.count || 0,
        comments_count: p.comments?.[0]?.count || 0,
      }));

    return NextResponse.json(
      {
        profile: sanitizedProfile,
        posts: formattedPosts,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (err: any) {
    console.error("Profile API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load profile" },
      { status: 500 }
    );
  }
}
