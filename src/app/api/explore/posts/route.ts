import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();

    const { data: postsData, error } = await adminClient
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*), likes(count), comments(count)")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Filter out suspended authors, unapproved gurus, and non-published posts
    const formattedPosts = (postsData || [])
      .filter((p: any) => {
        if (p.author?.is_suspended) return false;
        if (p.author?.role === "guru" && p.author?.guru_status !== "approved") return false;
        if (p.status !== "published") return false;
        return true;
      })
      .map((p: any) => ({
        ...p,
        likes_count: p.likes?.[0]?.count || 0,
        comments_count: p.comments?.[0]?.count || 0,
      }));

    return NextResponse.json(
      { posts: formattedPosts },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (err: any) {
    console.error("Explore posts error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch explore posts" },
      { 
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
