"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LikeButtonProps {
  postId: string;
  initialLiked?: boolean;
  initialCount?: number;
  currentUserId?: string | null;
  size?: "sm" | "md";
}

export function LikeButton({
  postId,
  initialLiked = false,
  initialCount = 0,
  currentUserId,
  size = "md",
}: LikeButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isLiked, setIsLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      router.push("/login");
      return;
    }

    if (loading) return;
    setLoading(true);

    const prevLiked = isLiked;
    const prevCount = count;

    // Optimistic update
    setIsLiked(!prevLiked);
    setCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      if (prevLiked) {
        // Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUserId);
      } else {
        // Like (triggers notification automatically via DB trigger)
        await supabase
          .from("likes")
          .insert({
            post_id: postId,
            user_id: currentUserId,
          });
      }
    } catch (err) {
      console.error("Like toggle error:", err);
      // Revert on error
      setIsLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  const isSmall = size === "sm";

  return (
    <button
      onClick={toggleLike}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-full transition-all ${
        isSmall ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-xs font-semibold"
      } ${
        isLiked
          ? "bg-red-50 text-red-600 border border-red-200 shadow-subtle"
          : "bg-white/80 hover:bg-cream-100 text-espresso/70 border border-parchment-border hover:border-copper/40"
      }`}
      title={isLiked ? "Unlike" : "Like this creation"}
    >
      <Heart
        className={`${isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} ${
          isLiked ? "fill-red-500 text-red-500 scale-110" : "text-espresso/60"
        } transition-transform`}
      />
      <span>{count}</span>
    </button>
  );
}

