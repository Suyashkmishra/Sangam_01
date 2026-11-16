import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();

    const { data: postsData, error } = await adminClient
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*), likes(count), comments(count)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Filter out suspended authors and unapproved gurus
    const formattedPosts = (postsData || [])
      .filter((p: any) => {
        if (p.author?.is_suspended) return false;
        if (p.author?.role === "guru" && p.author?.guru_status !== "approved") return false;
        return true;
      })
      .map((p: any) => ({
        ...p,
        likes_count: p.likes?.[0]?.count || 0,
        comments_count: p.comments?.[0]?.count || 0,
      }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (err: any) {
    console.error("Explore posts error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch explore posts" },
      { status: 500 }
    );
  }
}
