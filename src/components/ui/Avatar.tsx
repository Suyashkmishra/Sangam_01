import React from "react";
import Image from "next/image";

interface AvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  priority?: boolean;
}

const sizeMap = {
  xs: {
    container: "w-6 h-6 text-xs",
    logoPx: 20,
    textClass: "text-[11px]",
  },
  sm: {
    container: "w-8 h-8 text-sm",
    logoPx: 28,
    textClass: "text-xs",
  },
  md: {
    container: "w-10 h-10 text-base",
    logoPx: 36,
    textClass: "text-sm",
  },
  lg: {
    container: "w-12 h-12 text-lg",
    logoPx: 44,
    textClass: "text-base",
  },
  xl: {
    container: "w-16 h-16 text-2xl",
    logoPx: 58,
    textClass: "text-xl",
  },
  "2xl": {
    container: "w-20 h-20 text-3xl",
    logoPx: 72,
    textClass: "text-2xl",
  },
};

export function Avatar({
  name = "User",
  avatarUrl,
  role,
  size = "md",
  className = "",
  priority = false,
}: AvatarProps) {
  const currentSize = sizeMap[size] || sizeMap.md;
  const isAdmin = role === "admin" || name?.toLowerCase().includes("admin");

  // 1. Admin Avatar: Always show official Sangam logo in a clean round crop
  if (isAdmin) {
    return (
      <div
        className={`rounded-full bg-cream-100 border border-copper/30 flex items-center justify-center overflow-hidden shrink-0 shadow-subtle p-1 ${currentSize.container} ${className}`}
        title="Sangam Admin"
      >
        <Image
          src="/logo.png"
          alt="Sangam Admin"
          width={currentSize.logoPx}
          height={currentSize.logoPx}
          className="w-full h-full object-contain"
          priority={priority}
        />
      </div>
    );
  }

  // 2. Custom Uploaded Photo
  if (avatarUrl && avatarUrl.trim() !== "") {
    return (
      <div
        className={`relative rounded-full overflow-hidden border border-parchment-border shrink-0 shadow-subtle ${currentSize.container} ${className}`}
      >
        <Image
          src={avatarUrl}
          alt={name || "Avatar"}
          fill
          className="object-cover"
          sizes="80px"
          priority={priority}
        />
      </div>
    );
  }

  // 3. Initials Avatar: First letter in circle (cream/gold background, copper letter, serif font)
  const initial = (name || "S").trim().charAt(0).toUpperCase();

  return (
    <div
      className={`rounded-full bg-amber-100/90 border border-copper/25 text-copper-900 font-serif font-bold flex items-center justify-center shrink-0 select-none shadow-subtle ${currentSize.container} ${currentSize.textClass} ${className}`}
      title={name || "User"}
      aria-label={name || "User"}
    >
      <span>{initial}</span>
    </div>
  );
}
