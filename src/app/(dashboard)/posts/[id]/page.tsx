"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  Feather, 
  Music, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  Share2, 
  ArrowLeft, 
  Loader2, 
  ShieldAlert,
  CheckCircle2,
  Clock
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Post, Profile, Comment } from "@/lib/types/database.types";
import { Navbar } from "@/components/layout/Navbar";
import { RoleBadge } from "@/components/common/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LikeButton } from "@/components/posts/LikeButton";
import { MediaRenderer } from "@/components/posts/MediaRenderer";
import { CommentSection } from "@/components/posts/CommentSection";
import { ConnectModal } from "@/components/connect/ConnectModal";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [comments, setComments] = useState<(Comment & { author?: Profile })[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [existingConnection, setExistingConnection] = useState<any>(null);

  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPostData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        if (user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          if (prof) setCurrentUserProfile(prof as Profile);
        }

        // Fetch post with author
        const { data: postData, error: postErr } = await supabase
          .from("posts")
          .select("*, author:profiles!posts_author_id_fkey(*)")
          .eq("id", postId)
          .single();

        if (postErr || !postData) {
          console.error("Post fetch error:", postErr);
          setLoading(false);
          return;
        }

        setPost(postData as Post);
        setAuthor(postData.author as Profile);

        // Fetch comments with author
        const { data: commentsData } = await supabase
          .from("comments")
          .select("*, author:profiles!comments_user_id_fkey(*)")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        if (commentsData) setComments(commentsData as any);

        // Fetch likes count
        const { count: lCount } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId);
        setLikesCount(lCount || 0);

        // Check if current user liked
        if (user) {
          const { data: likeRecord } = await supabase
            .from("likes")
            .select("post_id")
            .eq("post_id", postId)
            .eq("user_id", user.id)
            .maybeSingle();
          setIsLiked(!!likeRecord);

          // Check if current user is Guru and author is Shishya, check existing connection
          if (postData.author?.role === "shishya") {
            const { data: conn } = await supabase
              .from("connections")
              .select("*")
              .eq("guru_id", user.id)
              .eq("shishya_id", postData.author_id)
              .maybeSingle();
            setExistingConnection(conn);
          }
        }
      } catch (err) {
        console.error("Post detail error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (postId) {
      loadPostData();
    }
  }, [postId]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-copper animate-spin mb-2" />
        <p className="text-sm text-espresso/70">Unfurling artistic manuscript...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="font-serif text-2xl font-bold text-espresso mb-2">Work Not Found</h2>
          <p className="text-xs text-espresso/60 mb-4">The creation you are seeking may have been removed or does not exist.</p>
          <Link href="/explore" className="px-5 py-2.5 bg-copper text-white rounded-xl text-xs font-semibold">
            Back to Explore
          </Link>
        </main>
      </div>
    );
  }

  const isHindi = post.language === "Hindi";
  const isKannada = post.language === "Kannada";
  const scriptFont = isHindi
    ? "font-devanagari text-lg sm:text-xl"
    : isKannada
    ? "font-kannada text-lg sm:text-xl"
    : "font-serif text-xl sm:text-2xl";

  const isViewerGuru = currentUserProfile?.role === "guru";
  const isAuthorShishya = author?.role === "shishya";
  const isGuruVerified = currentUserProfile?.is_verified && currentUserProfile?.guru_status === "approved";

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Navigation back */}
        <div className="mb-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-espresso/60 hover:text-copper transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Confluence Archive</span>
          </Link>
        </div>

        {/* Main Post Article Card */}
        <article className="bg-white rounded-3xl border border-parchment-border shadow-card p-6 sm:p-10">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-copper-800 bg-copper-50 border border-copper-200/80 px-3 py-1 rounded-full uppercase tracking-wider">
              {post.category === "poetry" ? <Feather className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
              <span>{post.category}</span>
            </span>

            <span className="text-xs font-semibold text-espresso/70 bg-cream-100 border border-parchment-border px-3 py-1 rounded-full">
              {post.language}
            </span>

            <span className="text-xs text-espresso/50 flex items-center gap-1 ml-auto">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(post.created_at).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}</span>
            </span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-espresso leading-tight mb-6">
            {post.title}
          </h1>

          {/* Author Block & Connect Action for Gurus */}
          <div className="bg-cream-50/70 border border-parchment-border rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link
              href={`/profile/${author?.id || post.author_id}`}
              className="flex items-center gap-3.5 group"
            >
              <Avatar
                name={author?.full_name}
                avatarUrl={author?.avatar_url}
                role={author?.role}
                size="lg"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-espresso group-hover:text-copper transition-colors">
                    {author?.full_name || "Anonymous Artist"}
                  </h3>
                  <RoleBadge
                    role={author?.role}
                    isVerified={author?.is_verified}
                    guruStatus={author?.guru_status}
                    size="sm"
                  />
                </div>
                {author?.city && (
                  <p className="text-[11px] text-espresso/60 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-copper-600" />
                    <span>{author.city}</span>
                  </p>
                )}
              </div>
            </Link>

            {/* Connect Button (for Gurus viewing a Shishya's work) */}
            {isViewerGuru && isAuthorShishya && (
              <div className="flex items-center gap-2">
                {existingConnection ? (
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-parchment-border text-espresso/80">
                      {existingConnection.status === "accepted" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-green-800">Connection Accepted</span>
                        </>
                      ) : existingConnection.status === "pending" ? (
                        <>
                          <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                          <span className="text-amber-800">Connection Pending</span>
                        </>
                      ) : (
                        <span>Connection Declined</span>
                      )}
                    </div>

                    {/* Option to send an additional note on this specific creation */}
                    {isGuruVerified && (
                      <button
                        onClick={() => setConnectModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-copper/10 hover:bg-copper text-copper hover:text-white transition-all"
                        title="Send another guidance note on this specific work"
                      >
                        + Send Note
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setConnectModalOpen(true)}
                    disabled={!isGuruVerified}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isGuruVerified
                        ? "bg-copper text-white hover:bg-copper-600 shadow-subtle"
                        : "bg-espresso/10 text-espresso/50 cursor-not-allowed"
                    }`}
                    title={!isGuruVerified ? "Awaiting admin verification" : "Initiate mentorship bond"}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Connect with Shishya</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Media Player (if attached) */}
          <MediaRenderer
            mediaUrl={post.media_url}
            mediaType={post.media_type}
            externalLink={post.external_link}
            title={post.title}
          />

          {/* Verse / Poem / Composition Body */}
          {post.body_text && (
            <div className="my-8 py-4 px-2">
              <div className={`${scriptFont} text-espresso/90 whitespace-pre-line leading-[2] tracking-wide`}>
                {post.body_text}
              </div>
            </div>
          )}

          {/* Interactions Footer Bar */}
          <div className="pt-6 border-t border-parchment-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LikeButton
                postId={post.id}
                initialLiked={isLiked}
                initialCount={likesCount}
                currentUserId={currentUser?.id}
                size="md"
              />

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cream-50 hover:bg-cream-100 border border-parchment-border text-espresso/70 rounded-full text-xs font-semibold transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? "Link Copied!" : "Share"}</span>
              </button>
            </div>

            <span className="text-xs text-espresso/50 italic">
              ✦ Sangam Living Archive
            </span>
          </div>

          {/* Commentary Section */}
          <CommentSection
            postId={post.id}
            initialComments={comments}
            currentUserId={currentUser?.id}
            currentUserProfile={currentUserProfile}
          />
        </article>
      </main>

      {/* Connect Modal for Gurus */}
      {author && currentUser && (
        <ConnectModal
          shishyaId={author.id}
          shishyaName={author.full_name}
          postId={post.id}
          postTitle={post.title}
          currentGuruId={currentUser.id}
          isVerifiedGuru={!!isGuruVerified}
          isOpen={connectModalOpen}
          onClose={() => setConnectModalOpen(false)}
          onSuccess={() => setExistingConnection({ status: "pending" })}
        />
      )}
    </div>
  );
}

