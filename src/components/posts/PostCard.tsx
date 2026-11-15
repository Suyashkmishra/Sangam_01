import React from "react";
import Link from "next/link";
import { Feather, Music, Video, MessageSquare, ExternalLink } from "lucide-react";
import { Post } from "@/lib/types/database.types";
import { RoleBadge } from "@/components/common/Badge";
import { LikeButton } from "@/components/posts/LikeButton";

interface PostCardProps {
  post: Post;
  currentUserId?: string | null;
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const isHindi = post.language === "Hindi";
  const isKannada = post.language === "Kannada";

  // Select appropriate typography class
  const fontClass = isHindi
    ? "font-devanagari text-base"
    : isKannada
    ? "font-kannada text-base"
    : "font-serif text-lg";

  return (
    <article className="group bg-white rounded-2xl border border-parchment-border hover:border-copper/50 transition-all p-5 sm:p-6 shadow-subtle hover:shadow-card flex flex-col justify-between">
      <div>
        {/* Header: Author Info & Badges */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/profile/${post.author?.id || post.author_id}`}
            className="flex items-center gap-2.5 group/author"
          >
            {post.author?.avatar_url ? (
              <img
                src={post.author.avatar_url}
                alt={post.author.full_name}
                className="w-9 h-9 rounded-full object-cover border border-parchment-border"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-copper-100 text-copper-800 flex items-center justify-center text-xs font-bold font-serif">
                {post.author?.full_name?.charAt(0).toUpperCase() || "A"}
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-espresso group-hover/author:text-copper transition-colors truncate max-w-[140px] sm:max-w-[200px]">
                {post.author?.full_name || "Anonymous Artist"}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-espresso/50">
                {post.author?.city && <span>{post.author.city} &bull; </span>}
                <span>{new Date(post.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <RoleBadge
              role={post.author?.role}
              isVerified={post.author?.is_verified}
              guruStatus={post.author?.guru_status}
              size="sm"
            />
          </div>
        </div>

        {/* Category & Language Pills */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-copper-800 bg-copper-50 border border-copper-200/80 px-2.5 py-0.5 rounded-full capitalize">
            {post.category === "poetry" ? <Feather className="w-3 h-3 text-copper-600" /> : <Music className="w-3 h-3 text-copper-600" />}
            <span>{post.category}</span>
          </span>

          <span className="text-[11px] font-medium text-espresso/70 bg-cream-100 border border-parchment-border px-2.5 py-0.5 rounded-full">
            {post.language}
          </span>

          {post.media_type === "audio" && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
              <Music className="w-2.5 h-2.5" />
              <span>Audio</span>
            </span>
          )}

          {post.media_type === "video" && (
            <span className="inline-flex items-center gap-1 text-[10px] text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full">
              <Video className="w-2.5 h-2.5" />
              <span>Video</span>
            </span>
          )}

          {post.external_link && (
            <span className="inline-flex items-center gap-1 text-[10px] text-red-800 bg-red-50 px-2 py-0.5 rounded-full">
              <ExternalLink className="w-2.5 h-2.5" />
              <span>Embed</span>
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/posts/${post.id}`}>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-espresso group-hover:text-copper transition-colors mb-2.5 leading-snug">
            {post.title}
          </h3>
        </Link>

        {/* Excerpt Body */}
        {post.body_text && (
          <p className={`${fontClass} text-espresso/80 line-clamp-3 mb-4 leading-relaxed whitespace-pre-line`}>
            {post.body_text}
          </p>
        )}
      </div>

      {/* Footer Controls: Like, Comment count, Read More */}
      <div className="pt-4 mt-2 border-t border-parchment-border/70 flex items-center justify-between text-xs text-espresso/70">
        <div className="flex items-center gap-2">
          <LikeButton
            postId={post.id}
            initialLiked={post.is_liked_by_user}
            initialCount={post.likes_count || 0}
            currentUserId={currentUserId}
            size="sm"
          />

          <Link
            href={`/posts/${post.id}#comments`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cream-50 hover:bg-cream-100 border border-parchment-border transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-espresso/60" />
            <span>{post.comments_count || 0}</span>
          </Link>
        </div>

        <Link
          href={`/posts/${post.id}`}
          className="font-semibold text-copper hover:text-copper-700 transition-colors"
        >
          View Work &rarr;
        </Link>
      </div>
    </article>
  );
}
