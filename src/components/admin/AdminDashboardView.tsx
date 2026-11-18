"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  FileText, 
  Clock, 
  UserX, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowRight,
  Loader2,
  CheckCircle2,
  Feather,
  Music,
  Activity
} from "lucide-react";
import { Profile } from "@/lib/types/database.types";
import { RoleBadge } from "@/components/common/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";

interface AdminDashboardViewProps {
  user: any;
  profile: Profile;
}

export function AdminDashboardView({ user, profile }: AdminDashboardViewProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGurus: 0,
    totalShishyas: 0,
    totalPosts: 0,
    pendingGurus: 0,
    suspendedUsers: 0,
    postsUnderReview: 0,
  });
  const [activity, setActivity] = useState<{
    latestSignups: any[];
    latestPosts: any[];
    latestActions: any[];
  }>({
    latestSignups: [],
    latestPosts: [],
    latestActions: [],
  });

  useEffect(() => {
    async function fetchAdminStats() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/admin/stats", {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        const data = await res.json();
        if (data.stats) setStats(data.stats);
        if (data.activity) setActivity(data.activity);
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdminStats();
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "";
    }
  };

  const formatActionTitle = (action: string) => {
    switch (action) {
      case "post_suspended": return "Suspended work";
      case "post_deleted": return "Deleted work";
      case "post_approved": return "Approved work";
      case "post_rejected": return "Rejected resubmission";
      case "user_suspended": return "Suspended user";
      case "user_reactivated": return "Reactivated user";
      case "guru_approved": return "Approved guru lineage";
      case "guru_rejected": return "Rejected guru application";
      default: return action.replace(/_/g, " ");
    }
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-8 space-y-8 animate-in fade-in duration-150">
      {/* Header: Admin Guardian Profile */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-parchment-border shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar
            name={profile?.full_name}
            avatarUrl={profile?.avatar_url}
            role="admin"
            size="xl"
          />

          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-espresso">
                {profile?.full_name || "Sangam Admin"}
              </h1>
              <RoleBadge role="admin" size="md" />
            </div>
            <p className="text-xs text-espresso/60 flex items-center gap-2">
              <span>{user?.email}</span>
              <span>&bull;</span>
              <span className="font-medium text-copper-800">Curatorial Oversight & Governance</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href="/admin?tab=gurus"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-espresso text-cream rounded-xl text-xs font-semibold hover:bg-espresso/90 transition-all shadow-subtle"
          >
            <ShieldCheck className="w-4 h-4 text-antiqueGold" />
            <span>Admin Sanctum</span>
          </Link>
          <Link
            href="/explore"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-parchment-border bg-cream-50 hover:bg-cream-100 rounded-xl text-xs font-semibold text-espresso transition-all"
          >
            <span>Explore Confluence</span>
            <ArrowUpRight className="w-4 h-4 text-copper-600" />
          </Link>
        </div>
      </div>

      {/* Admin Verification Sanctum Banner */}
      <div className="bg-espresso text-cream-100 p-6 rounded-3xl shadow-floating flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-antiqueGold/20 border border-antiqueGold text-antiqueGold flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-cream">Admin Verification Sanctum</h3>
            <p className="text-xs text-cream-200/80">
              You have <strong className="text-antiqueGold">{stats.pendingGurus} pending Guru application(s)</strong> awaiting lineage approval.
            </p>
          </div>
        </div>
        <Link
          href="/admin?tab=gurus"
          className="px-5 py-2.5 bg-antiqueGold text-espresso font-semibold text-xs rounded-xl hover:bg-antiqueGold-light transition-all flex items-center gap-1.5 flex-shrink-0 shadow-subtle"
        >
          <span>Review Pending Gurus</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 6 Stats Cards Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-espresso">Platform Intelligence</h2>
          <span className="text-[11px] text-espresso/50">Live database audit</span>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-parchment-border text-center">
            <Loader2 className="w-6 h-6 animate-spin text-copper mx-auto mb-2" />
            <p className="text-xs text-espresso/60 font-serif">Compiling platform telemetry...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* 1. Total Gurus */}
            <Link
              href="/admin?tab=gurus"
              className="bg-white p-5 rounded-2xl border border-parchment-border hover:border-copper/50 transition-all shadow-subtle group"
            >
              <div className="flex items-center justify-between text-espresso/60 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Gurus</span>
                <Users className="w-4 h-4 text-copper-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-serif text-2xl md:text-3xl font-bold text-espresso">{stats.totalGurus}</div>
              <p className="text-[10px] text-espresso/50 mt-1">Verified masters</p>
            </Link>

            {/* 2. Total Shishyas */}
            <Link
              href="/admin?tab=shishyas"
              className="bg-white p-5 rounded-2xl border border-parchment-border hover:border-copper/50 transition-all shadow-subtle group"
            >
              <div className="flex items-center justify-between text-espresso/60 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Shishyas</span>
                <GraduationCap className="w-4 h-4 text-copper-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-serif text-2xl md:text-3xl font-bold text-espresso">{stats.totalShishyas}</div>
              <p className="text-[10px] text-espresso/50 mt-1">Artists & poets</p>
            </Link>

            {/* 3. Total Posts */}
            <Link
              href="/admin?tab=posts"
              className="bg-white p-5 rounded-2xl border border-parchment-border hover:border-copper/50 transition-all shadow-subtle group"
            >
              <div className="flex items-center justify-between text-espresso/60 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Posts</span>
                <FileText className="w-4 h-4 text-copper-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-serif text-2xl md:text-3xl font-bold text-espresso">{stats.totalPosts}</div>
              <p className="text-[10px] text-espresso/50 mt-1">Poetry & Music</p>
            </Link>

            {/* 4. Pending Gurus */}
            <Link
              href="/admin?tab=gurus"
              className={`p-5 rounded-2xl border transition-all shadow-subtle group ${
                stats.pendingGurus > 0 ? "bg-amber-50/60 border-amber-300" : "bg-white border-parchment-border"
              }`}
            >
              <div className="flex items-center justify-between text-espresso/60 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Gurus</span>
                <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
              </div>
              <div className="font-serif text-2xl md:text-3xl font-bold text-amber-950">{stats.pendingGurus}</div>
              <p className="text-[10px] text-amber-900/70 mt-1">Awaiting review</p>
            </Link>

            {/* 5. Suspended Users */}
            <Link
              href="/admin?tab=gurus"
              className={`p-5 rounded-2xl border transition-all shadow-subtle group ${
                stats.suspendedUsers > 0 ? "bg-red-50/60 border-red-200" : "bg-white border-parchment-border"
              }`}
            >
              <div className="flex items-center justify-between text-espresso/60 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Suspended</span>
                <UserX className="w-4 h-4 text-red-600" />
              </div>
              <div className="font-serif text-2xl md:text-3xl font-bold text-red-950">{stats.suspendedUsers}</div>
              <p className="text-[10px] text-red-800/70 mt-1">Access restricted</p>
            </Link>

            {/* 6. Posts Under Review */}
            <Link
              href="/admin?tab=posts"
              className={`p-5 rounded-2xl border transition-all shadow-subtle group ${
                stats.postsUnderReview > 0 ? "bg-copper-50/60 border-copper-300" : "bg-white border-parchment-border"
              }`}
            >
              <div className="flex items-center justify-between text-espresso/60 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Under Review</span>
                <ShieldAlert className="w-4 h-4 text-copper-700" />
              </div>
              <div className="font-serif text-2xl md:text-3xl font-bold text-copper-900">{stats.postsUnderReview}</div>
              <p className="text-[10px] text-copper-800/70 mt-1">Resubmissions</p>
            </Link>
          </div>
        )}
      </section>

      {/* 3 Quick Action Cards */}
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-espresso">Quick Administrative Workflows</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/admin?tab=gurus"
            className="group bg-white p-6 rounded-3xl border border-parchment-border hover:border-copper/60 transition-all shadow-subtle hover:shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <h3 className="font-serif text-lg font-bold text-espresso mb-1">
                Review Pending Gurus
              </h3>
              <p className="text-xs text-espresso/70 leading-relaxed">
                Review lineage credentials, verify classical training, and approve verified master badges.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-copper group-hover:translate-x-1 transition-transform">
              <span>Examine applications ({stats.pendingGurus})</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <Link
            href="/admin?tab=shishyas"
            className="group bg-white p-6 rounded-3xl border border-parchment-border hover:border-copper/60 transition-all shadow-subtle hover:shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-copper-50 border border-copper-200 text-copper-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5 text-copper-700" />
              </div>
              <h3 className="font-serif text-lg font-bold text-espresso mb-1">
                Manage Platform Users
              </h3>
              <p className="text-xs text-espresso/70 leading-relaxed">
                Audit community profiles, oversee apprentice and master accounts, and handle suspensions.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-copper group-hover:translate-x-1 transition-transform">
              <span>View community directory</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <Link
            href="/admin?tab=posts"
            className="group bg-white p-6 rounded-3xl border border-parchment-border hover:border-copper/60 transition-all shadow-subtle hover:shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-cream-100 border border-parchment-border text-espresso flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5 text-espresso" />
              </div>
              <h3 className="font-serif text-lg font-bold text-espresso mb-1">
                Review Cultural Creations
              </h3>
              <p className="text-xs text-espresso/70 leading-relaxed">
                Moderate poetry verses and compositions, inspect resubmitted works, and curate the public archive.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-copper group-hover:translate-x-1 transition-transform">
              <span>Open moderation queue ({stats.postsUnderReview})</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Activity: 3 Streams */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-copper-600" />
            <h2 className="font-serif text-lg font-bold text-espresso">Recent Platform Activity</h2>
          </div>
          <span className="text-xs text-espresso/50">Real-time telemetry</span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Stream 1: Latest Signups */}
          <div className="bg-white p-5 rounded-3xl border border-parchment-border shadow-subtle space-y-3">
            <div className="flex items-center justify-between border-b border-parchment-border pb-2.5">
              <span className="text-xs font-bold text-espresso uppercase tracking-wider">Latest Signups</span>
              <Users className="w-3.5 h-3.5 text-espresso/40" />
            </div>

            {activity.latestSignups.length === 0 ? (
              <p className="text-xs text-espresso/50 italic py-4 text-center">No recent signups recorded.</p>
            ) : (
              <div className="space-y-2.5">
                {activity.latestSignups.map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={user.full_name} avatarUrl={user.avatar_url} role={user.role} size="sm" />
                      <div className="min-w-0">
                        <Link href={`/profile/${user.id}`} className="font-semibold text-espresso hover:text-copper transition-colors truncate block">
                          {user.full_name}
                        </Link>
                        <p className="text-[10px] text-espresso/50 truncate">
                          {user.role} {user.city ? `• ${user.city}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-espresso/40 flex-shrink-0">
                      {formatTimeAgo(user.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stream 2: Latest Posts */}
          <div className="bg-white p-5 rounded-3xl border border-parchment-border shadow-subtle space-y-3">
            <div className="flex items-center justify-between border-b border-parchment-border pb-2.5">
              <span className="text-xs font-bold text-espresso uppercase tracking-wider">Latest Works</span>
              <FileText className="w-3.5 h-3.5 text-espresso/40" />
            </div>

            {activity.latestPosts.length === 0 ? (
              <p className="text-xs text-espresso/50 italic py-4 text-center">No creations published yet.</p>
            ) : (
              <div className="space-y-2.5">
                {activity.latestPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 space-y-0.5">
                      <Link href={`/posts/${post.id}`} className="font-serif font-bold text-espresso hover:text-copper transition-colors truncate block">
                        “{post.title}”
                      </Link>
                      <p className="text-[10px] text-espresso/50 truncate">
                        By {post.author?.full_name || "Artist"} • {post.category}
                      </p>
                    </div>
                    <span className="text-[10px] text-espresso/40 flex-shrink-0">
                      {formatTimeAgo(post.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stream 3: Latest Admin Actions */}
          <div className="bg-white p-5 rounded-3xl border border-parchment-border shadow-subtle space-y-3">
            <div className="flex items-center justify-between border-b border-parchment-border pb-2.5">
              <span className="text-xs font-bold text-espresso uppercase tracking-wider">Admin Audit Log</span>
              <ShieldCheck className="w-3.5 h-3.5 text-antiqueGold" />
            </div>

            {activity.latestActions.length === 0 ? (
              <p className="text-xs text-espresso/50 italic py-4 text-center">No moderation actions recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {activity.latestActions.map((act) => (
                  <div key={act.id} className="space-y-0.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-espresso truncate">
                        {formatActionTitle(act.action)}
                      </span>
                      <span className="text-[10px] text-espresso/40 flex-shrink-0">
                        {formatTimeAgo(act.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-copper-800 truncate">
                      Target: {act.target_name || act.target_id}
                    </p>
                    {act.reason && (
                      <p className="text-[10px] text-espresso/50 italic truncate">
                        "{act.reason}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
