"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  PlusCircle, 
  Compass, 
  Heart, 
  MessageSquare, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  ArrowUpRight,
  Loader2,
  FileText,
  Music
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types/database.types";
import { Navbar } from "@/components/layout/Navbar";
import { PendingGuruBanner } from "@/components/layout/PendingGuruBanner";
import { RoleBadge } from "@/components/common/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    postsCount: 0,
    likesReceived: 0,
    connectionsCount: 0,
    unreadNotifications: 0,
    pendingGurusCount: 0,
  });

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        // Fetch user profile
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        let currentProfile: Profile;
        if (prof) {
          currentProfile = prof as Profile;
          setProfile(currentProfile);
        } else {
          currentProfile = {
            id: user.id,
            role: (user.user_metadata?.role as any) || "shishya",
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Artist",
            bio: "",
            city: "",
            languages: ["Hindi"],
            avatar_url: null,
            guru_status: user.user_metadata?.role === "guru" ? "pending" : "none",
            is_verified: false,
            created_at: new Date().toISOString(),
          };
          setProfile(currentProfile);
        }

        // Fetch counts for summary cards
        // 1. My posts count
        const { count: postsCount } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("author_id", user.id);

        // 2. Connections count
        const connField = currentProfile.role === "guru" ? "guru_id" : "shishya_id";
        const { count: connectionsCount } = await supabase
          .from("connections")
          .select("*", { count: "exact", head: true })
          .eq(connField, user.id);

        // 3. Unread notifications
        const { count: unreadCount } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        // 4. If admin, get pending gurus count
        let pendingGurus = 0;
        if (currentProfile.role === "admin") {
          const { count: pGCount } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("guru_status", "pending");
          pendingGurus = pGCount || 0;
        }

        setStats({
          postsCount: postsCount || 0,
          likesReceived: 0,
          connectionsCount: connectionsCount || 0,
          unreadNotifications: unreadCount || 0,
          pendingGurusCount: pendingGurus,
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-copper animate-spin mb-2" />
        <p className="text-sm text-espresso/70 font-medium">Entering your artist dashboard...</p>
      </div>
    );
  }

  // Dedicated Admin Dashboard for role === 'admin'
  if (profile?.role === "admin") {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <AdminDashboardView user={user} profile={profile} />
      </div>
    );
  }

  const isPendingGuru = profile?.role === "guru" && (!profile.is_verified || profile.guru_status === "pending");

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      {/* Prominent Pending Guru Verification Banner if applicable */}
      {isPendingGuru && <PendingGuruBanner />}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-parchment-border shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar
              name={profile?.full_name}
              avatarUrl={profile?.avatar_url}
              role={profile?.role}
              size="xl"
            />

            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-espresso">
                  {profile?.full_name || "Artist"}
                </h1>
                <RoleBadge
                  role={profile?.role}
                  isVerified={profile?.is_verified}
                  guruStatus={profile?.guru_status}
                  size="md"
                />
              </div>
              <p className="text-xs text-espresso/60 flex items-center gap-2">
                <span>{user?.email}</span>
                {profile?.city && (
                  <>
                    <span>&bull;</span>
                    <span>{profile.city}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              href="/posts/create"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-copper text-white rounded-xl text-xs font-semibold hover:bg-copper-600 transition-all shadow-subtle"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish Work</span>
            </Link>
            <Link
              href="/explore"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-parchment-border bg-cream-50 hover:bg-cream-100 rounded-xl text-xs font-semibold text-espresso transition-all"
            >
              <Compass className="w-4 h-4 text-copper-600" />
              <span>Explore Confluence</span>
            </Link>
          </div>
        </div>



        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-parchment-border shadow-subtle">
            <div className="flex items-center justify-between text-espresso/60 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Published Works</span>
              <FileText className="w-4 h-4 text-copper-600" />
            </div>
            <div className="font-serif text-3xl font-bold text-espresso">{stats.postsCount}</div>
            <p className="text-[11px] text-espresso/60 mt-1">Poetry & Music</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-parchment-border shadow-subtle">
            <div className="flex items-center justify-between text-espresso/60 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {profile?.role === "guru" ? "Mentorship Bonds" : "Connections"}
              </span>
              <Users className="w-4 h-4 text-copper-600" />
            </div>
            <div className="font-serif text-3xl font-bold text-espresso">{stats.connectionsCount}</div>
            <p className="text-[11px] text-espresso/60 mt-1">
              {profile?.role === "guru" ? "Apprentices & Requests" : "Guru Confluences"}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-parchment-border shadow-subtle">
            <div className="flex items-center justify-between text-espresso/60 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Unread Alerts</span>
              <Clock className="w-4 h-4 text-copper-600" />
            </div>
            <div className="font-serif text-3xl font-bold text-espresso">{stats.unreadNotifications}</div>
            <p className="text-[11px] text-espresso/60 mt-1">Activity & Interactions</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-parchment-border shadow-subtle">
            <div className="flex items-center justify-between text-espresso/60 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Artistic Status</span>
              <Sparkles className="w-4 h-4 text-antiqueGold" />
            </div>
            <div className="font-serif text-lg font-bold text-espresso truncate">
              {profile?.role === "guru" 
                ? (profile.is_verified ? "Verified Master" : "Under Review")
                : "Active Shishya"
              }
            </div>
            <p className="text-[11px] text-espresso/60 mt-1">
              {profile?.role === "guru" && !profile.is_verified ? "Awaiting approval" : "Full access"}
            </p>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/explore"
            className="group bg-white p-6 rounded-2xl border border-parchment-border hover:border-copper/60 transition-all shadow-subtle hover:shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-copper-50 text-copper-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-bold text-espresso mb-1">
                Explore The Confluence
              </h3>
              <p className="text-xs text-espresso/70 leading-relaxed">
                Discover unrecognised poets and acoustic artists across Hindi, Kannada, and English.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-copper group-hover:translate-x-1 transition-transform">
              <span>Browse works</span>
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <Link
            href="/profile"
            className="group bg-white p-6 rounded-2xl border border-parchment-border hover:border-copper/60 transition-all shadow-subtle hover:shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-copper-50 text-copper-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-bold text-espresso mb-1">
                Artist Profile & Contacts
              </h3>
              <p className="text-xs text-espresso/70 leading-relaxed">
                Manage your bio, languages, and specify your WhatsApp or Instagram contact for approved connections.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-copper group-hover:translate-x-1 transition-transform">
              <span>Manage profile</span>
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <Link
            href="/notifications"
            className="group bg-white p-6 rounded-2xl border border-parchment-border hover:border-copper/60 transition-all shadow-subtle hover:shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-copper-50 text-copper-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-bold text-espresso mb-1">
                Mentorship Requests
              </h3>
              <p className="text-xs text-espresso/70 leading-relaxed">
                Review connection requests, accept or reject Guru notes, and track your lineage notifications.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-copper group-hover:translate-x-1 transition-transform">
              <span>View requests</span>
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

