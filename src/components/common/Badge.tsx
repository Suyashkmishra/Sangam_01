import React from "react";
import { CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { UserRole, GuruStatus } from "@/lib/types/database.types";

interface RoleBadgeProps {
  role?: UserRole;
  isVerified?: boolean;
  guruStatus?: GuruStatus;
  size?: "sm" | "md";
}

export function RoleBadge({ role, isVerified, guruStatus, size = "md" }: RoleBadgeProps) {
  const isSmall = size === "sm";
  const padding = isSmall ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs font-semibold";

  if (role === "admin") {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-espresso text-cream-100 ${padding}`}>
        <Sparkles className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
        <span>Admin</span>
      </span>
    );
  }

  if (role === "guru") {
    if (isVerified || guruStatus === "approved") {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-antiqueGold/15 border border-antiqueGold/40 text-antiqueGold-dark font-medium ${padding}`}>
          <CheckCircle2 className={`text-antiqueGold ${isSmall ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
          <span>Verified Guru</span>
        </span>
      );
    }

    if (guruStatus === "pending") {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-copper-50 border border-copper-300 text-copper-700 font-medium ${padding}`}>
          <ShieldAlert className={`text-copper-600 ${isSmall ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
          <span>Pending Guru</span>
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-espresso-50 text-espresso-700 border border-espresso-200 ${padding}`}>
        <span>Guru</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-copper-100/60 border border-copper-200 text-copper-800 font-medium ${padding}`}>
      <span>Shishya</span>
    </span>
  );
}

