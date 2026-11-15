"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MessageSquare, Send, Loader2, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Comment, Profile } from "@/lib/types/database.types";
import { RoleBadge } from "@/components/common/Badge";

interface CommentSectionProps {
  postId: string;
  initialComments: (Comment & { author?: Profile })[];
  currentUserId?: string | null;
  currentUserProfile?: Profile | null;
}

export function CommentSection({
  postId,
  initialComments,
  currentUserId,
  currentUserProfile,
}: CommentSectionProps) {
  const supabase = createClient();

  const [comments, setComments] = useState<(Comment & { author?: Profile })[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    setSubmitting(true);
    setErrorMsg("");

    const commentBody = newComment.trim();

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: currentUserId,
          body: commentBody,
        })
        .select("*, author:profiles(*)")
        .single();

      if (error) throw error;

      if (data) {
        setComments([...comments, data as any]);
      } else {
        // Fallback optimistic insertion
        setComments([
          ...comments,
          {
            id: `temp_${Date.now()}`,
            post_id: postId,
            user_id: currentUserId,
            body: commentBody,
            created_at: new Date().toISOString(),
            author: currentUserProfile || undefined,
          },
        ]);
      }

      setNewComment("");
    } catch (err: any) {
      console.error("Comment submit error:", err);
      setErrorMsg(err.message || "Failed to submit commentary");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="comments" className="mt-10 pt-8 border-t border-parchment-border">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-copper-600" />
        <h3 className="font-serif text-2xl font-bold text-espresso">
          Artistic Reflections ({comments.length})
        </h3>
      </div>

      {/* Comment Input */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-white border border-parchment-border rounded-2xl p-3 shadow-subtle focus-within:border-copper/80 transition-all">
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Offer your poetic reflections or musical critique..."
              required
              className="w-full bg-transparent text-sm text-espresso placeholder-espresso/40 resize-none focus:outline-none"
            />
            <div className="flex items-center justify-between pt-2 border-t border-parchment-border/60">
              <span className="text-[11px] text-espresso/50">
                Commenting as <strong className="text-espresso">{currentUserProfile?.full_name || "Artist"}</strong>
              </span>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-copper text-white rounded-xl text-xs font-semibold hover:bg-copper-600 disabled:opacity-50 transition-all shadow-subtle"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reflection</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {errorMsg && <p className="text-xs text-red-600 mt-2">{errorMsg}</p>}
        </form>
      ) : (
        <div className="mb-8 p-4 bg-cream-100 border border-parchment-border rounded-2xl text-center">
          <p className="text-xs text-espresso/70 mb-3">
            Sign in to share reflections, feedback, and notes on this work.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2 bg-copper text-white text-xs font-semibold rounded-xl hover:bg-copper-600 transition-all shadow-subtle"
          >
            Sign in to Comment
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-xs text-espresso/50 italic py-4">
            No reflections yet. Be the first to share your soul's resonance.
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-parchment-border shadow-subtle"
            >
              <div className="flex items-center justify-between mb-2">
                <Link
                  href={`/profile/${comment.author?.id || comment.user_id}`}
                  className="flex items-center gap-2 group"
                >
                  {comment.author?.avatar_url ? (
                    <img
                      src={comment.author.avatar_url}
                      alt={comment.author.full_name}
                      className="w-7 h-7 rounded-full object-cover border border-parchment-border"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-copper-100 text-copper-800 flex items-center justify-center text-xs font-bold font-serif">
                      {comment.author?.full_name?.charAt(0).toUpperCase() || "A"}
                    </div>
                  )}
                  <span className="text-xs font-bold text-espresso group-hover:text-copper transition-colors">
                    {comment.author?.full_name || "Artist"}
                  </span>
                  <RoleBadge
                    role={comment.author?.role}
                    isVerified={comment.author?.is_verified}
                    guruStatus={comment.author?.guru_status}
                    size="sm"
                  />
                </Link>

                <span className="text-[10px] text-espresso/50">
                  {new Date(comment.created_at).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-espresso/80 whitespace-pre-line leading-relaxed pl-9">
                {comment.body}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

