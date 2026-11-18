import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;

  return { user, profile };
}

export async function GET(request: NextRequest) {
  try {
    const authAdmin = await getAuthenticatedAdmin(request);
    if (!authAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const adminClient = createAdminClient();
    const url = new URL(request.url);
    const filterTab = url.searchParams.get("tab") || "all"; // 'resubmitted' | 'suspended' | 'all'

    let query = adminClient
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*), likes(count), comments(count)")
      .order("created_at", { ascending: false });

    if (filterTab === "resubmitted") {
      query = query.eq("status", "pending_review");
    } else if (filterTab === "suspended") {
      query = query.eq("status", "suspended");
    }

    const { data: posts, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Counts for tabs
    const { count: pendingCount } = await adminClient
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review");

    const { count: suspendedCount } = await adminClient
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "suspended");

    const { count: totalCount } = await adminClient
      .from("posts")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      posts: (posts || []).map((p: any) => ({
        ...p,
        likes_count: p.likes?.[0]?.count || 0,
        comments_count: p.comments?.[0]?.count || 0,
      })),
      counts: {
        all: totalCount || 0,
        resubmitted: pendingCount || 0,
        suspended: suspendedCount || 0,
      },
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (err: any) {
    console.error("Admin posts GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authAdmin = await getAuthenticatedAdmin(request);
    if (!authAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await request.json();
    const { action, postId, reason } = body;

    if (!postId || !action) {
      return NextResponse.json({ error: "Missing required parameters: action and postId" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Fetch existing post
    const { data: post, error: postErr } = await adminClient
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*)")
      .eq("id", postId)
      .single();

    if (postErr || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const authorId = post.author_id;
    const authorName = post.author?.full_name || "Artist";
    const postTitle = post.title;

    if (action === "suspend") {
      if (!reason || !reason.trim()) {
        return NextResponse.json({ error: "A suspension reason is strictly required." }, { status: 400 });
      }

      const trimReason = reason.trim();
      const { error: updateErr } = await adminClient
        .from("posts")
        .update({
          status: "suspended",
          moderation_reason: trimReason,
          moderated_at: new Date().toISOString(),
          moderated_by: authAdmin.user.id,
        })
        .eq("id", postId);

      if (updateErr) throw updateErr;

      // Log in admin_actions
      try {
        await adminClient.from("admin_actions").insert({
          admin_id: authAdmin.user.id,
          action: "post_suspended",
          target_type: "post",
          target_id: postId,
          target_name: postTitle,
          reason: trimReason,
        });
      } catch (logErr) {
        console.warn("admin_actions insert notice:", logErr);
      }

      // Notify author
      const message = `Your post '${postTitle}' was suspended by the admin. Reason: ${trimReason}. You can edit it and resubmit it.`;
      try {
        await adminClient.from("notifications").insert({
          user_id: authorId,
          actor_id: authAdmin.user.id,
          type: "post_suspended",
          post_id: postId,
          post_title: postTitle,
          reason: trimReason,
          message: message,
        });
      } catch (notifErr) {
        console.warn("Notification insert notice:", notifErr);
      }

      // Revalidate
      revalidatePath("/");
      revalidatePath("/explore");
      revalidatePath("/profile");
      revalidatePath(`/posts/${postId}`);

      return NextResponse.json({
        success: true,
        message: `Post '${postTitle}' has been suspended.`,
      });
    }

    if (action === "delete") {
      if (!reason || !reason.trim()) {
        return NextResponse.json({ error: "A deletion reason is strictly required." }, { status: 400 });
      }

      const trimReason = reason.trim();

      // 1. Log in admin_actions FIRST so audit trail is preserved
      try {
        await adminClient.from("admin_actions").insert({
          admin_id: authAdmin.user.id,
          action: "post_deleted",
          target_type: "post",
          target_id: postId,
          target_name: postTitle,
          reason: trimReason,
        });
      } catch (logErr) {
        console.warn("admin_actions insert notice:", logErr);
      }

      // 2. Notify the author BEFORE deleting the post
      const message = `Your post '${postTitle}' was removed by the admin. Reason: ${trimReason}. You are welcome to publish a new post.`;
      try {
        await adminClient.from("notifications").insert({
          user_id: authorId,
          actor_id: authAdmin.user.id,
          type: "post_deleted",
          post_id: null, // explicitly null so notification remains forever
          post_title: postTitle,
          reason: trimReason,
          message: message,
        });
      } catch (notifErr) {
        console.warn("Notification insert notice:", notifErr);
      }

      // 3. Remove media from storage if stored in post-media
      if (post.media_url && post.media_url.includes("post-media")) {
        try {
          const parts = post.media_url.split("post-media/");
          if (parts[1]) {
            const storagePath = decodeURIComponent(parts[1].split("?")[0]);
            await adminClient.storage.from("post-media").remove([storagePath]);
          }
        } catch (storageErr) {
          console.warn("Storage deletion warning:", storageErr);
        }
      }

      // 4. Clean up relations
      try {
        await adminClient.from("likes").delete().eq("post_id", postId);
      } catch {}
      try {
        await adminClient.from("comments").delete().eq("post_id", postId);
      } catch {}
      try {
        await adminClient.from("connections").update({ post_id: null }).eq("post_id", postId);
      } catch {}

      // 5. Delete post
      const { error: delErr } = await adminClient.from("posts").delete().eq("id", postId);
      if (delErr) throw delErr;

      // Revalidate
      revalidatePath("/");
      revalidatePath("/explore");
      revalidatePath("/profile");

      return NextResponse.json({
        success: true,
        message: `Post '${postTitle}' has been permanently deleted.`,
      });
    }

    if (action === "approve" || action === "restore") {
      const { error: updateErr } = await adminClient
        .from("posts")
        .update({
          status: "published",
          moderation_reason: null,
          moderated_at: new Date().toISOString(),
          moderated_by: authAdmin.user.id,
        })
        .eq("id", postId);

      if (updateErr) throw updateErr;

      try {
        await adminClient.from("admin_actions").insert({
          admin_id: authAdmin.user.id,
          action: "post_approved",
          target_type: "post",
          target_id: postId,
          target_name: postTitle,
          reason: action === "restore" ? "Restored by admin" : "Approved by admin",
        });
      } catch (logErr) {
        console.warn("admin_actions insert notice:", logErr);
      }

      // Notify author
      const message = `Your post '${postTitle}' has been approved by the admin and published.`;
      try {
        await adminClient.from("notifications").insert({
          user_id: authorId,
          actor_id: authAdmin.user.id,
          type: "post_approved",
          post_id: postId,
          post_title: postTitle,
          message: message,
        });
      } catch (notifErr) {
        console.warn("Notification insert notice:", notifErr);
      }

      revalidatePath("/");
      revalidatePath("/explore");
      revalidatePath("/profile");
      revalidatePath(`/posts/${postId}`);

      return NextResponse.json({
        success: true,
        message: `Post '${postTitle}' is now published and visible to the community.`,
      });
    }

    if (action === "reject") {
      if (!reason || !reason.trim()) {
        return NextResponse.json({ error: "A rejection reason is strictly required." }, { status: 400 });
      }

      const trimReason = reason.trim();
      const { error: updateErr } = await adminClient
        .from("posts")
        .update({
          status: "suspended",
          moderation_reason: trimReason,
          moderated_at: new Date().toISOString(),
          moderated_by: authAdmin.user.id,
        })
        .eq("id", postId);

      if (updateErr) throw updateErr;

      try {
        await adminClient.from("admin_actions").insert({
          admin_id: authAdmin.user.id,
          action: "post_rejected",
          target_type: "post",
          target_id: postId,
          target_name: postTitle,
          reason: trimReason,
        });
      } catch (logErr) {
        console.warn("admin_actions insert notice:", logErr);
      }

      // Notify author
      const message = `Your resubmission for '${postTitle}' was rejected by the admin. Reason: ${trimReason}.`;
      try {
        await adminClient.from("notifications").insert({
          user_id: authorId,
          actor_id: authAdmin.user.id,
          type: "post_rejected",
          post_id: postId,
          post_title: postTitle,
          reason: trimReason,
          message: message,
        });
      } catch (notifErr) {
        console.warn("Notification insert notice:", notifErr);
      }

      revalidatePath("/");
      revalidatePath("/explore");
      revalidatePath("/profile");
      revalidatePath(`/posts/${postId}`);

      return NextResponse.json({
        success: true,
        message: `Resubmission for '${postTitle}' was rejected.`,
      });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin post action error:", err);
    return NextResponse.json({ error: err.message || "Failed to process request" }, { status: 500 });
  }
}
