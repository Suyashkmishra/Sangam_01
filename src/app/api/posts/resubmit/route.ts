import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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
        // Fallback
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Please sign in." }, { status: 401 });
    }

    const body = await request.json();
    const { postId, title, bodyText, category, language } = body;

    if (!postId || !title?.trim()) {
      return NextResponse.json({ error: "Post ID and title are required." }, { status: 400 });
    }

    // Verify post exists and belongs to user
    const { data: post, error: postErr } = await adminClient
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*)")
      .eq("id", postId)
      .single();

    if (postErr || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.author_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You can only edit your own posts." }, { status: 403 });
    }

    // Update post: author resubmission sets status to 'pending_review'
    const { error: updateErr } = await adminClient
      .from("posts")
      .update({
        title: title.trim(),
        body_text: bodyText?.trim() || null,
        category: category || post.category,
        language: language || post.language,
        status: "pending_review",
      })
      .eq("id", postId);

    if (updateErr) throw updateErr;

    const authorName = post.author?.full_name || "Artist";

    // Notify all admins: "[author] resubmitted '[title]'"
    const { data: admins } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const notifs = admins.map((a: any) => ({
        user_id: a.id,
        actor_id: user.id,
        type: "post_resubmitted",
        post_id: postId,
        post_title: title.trim(),
        message: `${authorName} resubmitted '${title.trim()}' for moderation review.`,
      }));

      try {
        await adminClient.from("notifications").insert(notifs);
      } catch {}
    }

    revalidatePath("/");
    revalidatePath("/explore");
    revalidatePath("/profile");
    revalidatePath(`/posts/${postId}`);

    return NextResponse.json({
      success: true,
      message: "Your creation has been updated and resubmitted for admin curatorial review.",
    });
  } catch (err: any) {
    console.error("Post resubmit error:", err);
    return NextResponse.json({ error: err.message || "Failed to resubmit post" }, { status: 500 });
  }
}
