"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Users, 
  UserX, 
  UserCheck, 
  Loader2, 
  AlertTriangle,
  ArrowRight,
  Search,
  FileText,
  RotateCcw,
  Trash2,
  ShieldAlert,
  Feather,
  Music
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile, Post } from "@/lib/types/database.types";
import { Navbar } from "@/components/layout/Navbar";
import { RoleBadge } from "@/components/common/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { AdminPostActionModal } from "@/components/admin/AdminPostActionModal";

function AdminSanctumContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Top Tabs: 'gurus' | 'shishyas' | 'posts'
  const initialTab = (searchParams.get("tab") as "gurus" | "shishyas" | "posts") || "gurus";
  const [activeTab, setActiveTab] = useState<"gurus" | "shishyas" | "posts">(initialTab);

  // Sub-filter for Users: 'active' | 'suspended' | 'all'
  const [userStatusFilter, setUserStatusFilter] = useState<"active" | "suspended" | "all">("all");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Sub-filter for Posts: 'resubmitted' | 'suspended' | 'all'
  const [postTab, setPostTab] = useState<"resubmitted" | "suspended" | "all">("resubmitted");
  const [postSearchQuery, setPostSearchQuery] = useState("");

  // Data states
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [pendingGurus, setPendingGurus] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postCounts, setPostCounts] = useState({ all: 0, resubmitted: 0, suspended: 0 });

  // Loading states
  const [usersLoading, setUsersLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modals
  const [confirmModal, setConfirmModal] = useState<{
    user: Profile;
    action: "suspend" | "reactivate";
  } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // Post Action Modal
  const [postModal, setPostModal] = useState<{
    action: "suspend" | "delete" | "reject";
    post: Post;
  } | null>(null);

  const [feedbackMsg, setFeedbackMsg] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (prof?.role !== "admin") {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      await Promise.all([loadUsersData(), loadPostsData()]);
    } catch (err) {
      console.error("Admin verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsersData = async () => {
    try {
      setUsersLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/users", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const data = await res.json();
      if (data.users) {
        setAllUsers(data.users);
        setPendingGurus(data.users.filter((u: Profile) => u.role === "guru" && u.guru_status === "pending"));
      }
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadPostsData = async () => {
    try {
      setPostsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/posts?tab=${postTab}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
      if (data.counts) {
        setPostCounts(data.counts);
      }
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  // Reload posts when postTab changes
  useEffect(() => {
    if (isAdmin) {
      loadPostsData();
    }
  }, [postTab]);

  // Handle Guru Application Decision (Approve / Reject)
  const handleGuruDecision = async (guruId: string, decision: "approve" | "reject") => {
    setActionLoadingId(guruId);
    setFeedbackMsg("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          userId: guruId,
          action: decision === "approve" ? "guru_approve" : "guru_reject",
          reason: decision === "approve" ? "Verified lineage by admin curator" : "Did not meet lineage verification criteria",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process application");

      setFeedbackMsg(data.message);
      loadUsersData();
    } catch (err: any) {
      alert(err.message || "Failed to update guru status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Execute User Suspension Toggle (Suspend / Reactivate)
  const executeSuspensionToggle = async () => {
    if (!confirmModal) return;
    setModalLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          userId: confirmModal.user.id,
          action: confirmModal.action,
          reason: suspendReason.trim() || (confirmModal.action === "suspend" ? "Community standards violation" : "Reactivated by admin"),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setFeedbackMsg(data.message);
      setConfirmModal(null);
      setSuspendReason("");
      loadUsersData();
    } catch (err: any) {
      alert(err.message || "Failed to modify user status.");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Post Action (Approve / Restore)
  const handlePostDirectAction = async (postId: string, action: "approve" | "restore") => {
    setActionLoadingId(postId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ action, postId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setFeedbackMsg(data.message);
      loadPostsData();
    } catch (err: any) {
      alert(err.message || "Failed to execute post action.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-copper" />
            <p className="text-xs text-espresso/60 font-serif">Verifying Guardian Access...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-700 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-espresso mb-2">
            Restricted Admin Sanctum
          </h2>
          <p className="text-xs text-espresso/60 max-w-sm mb-4">
            You must be signed in with the Admin account to access mentor verification, user management, and post moderation.
          </p>
          <Link
            href="/login"
            className="px-5 py-2.5 bg-copper text-white rounded-xl text-xs font-semibold hover:bg-copper-600 transition-all shadow-subtle"
          >
            Sign in as Admin
          </Link>
        </main>
      </div>
    );
  }

  // Filter Users Lists
  const gurusList = allUsers.filter((u) => u.role === "guru");
  const shishyasList = allUsers.filter((u) => u.role === "shishya");

  const filteredGurus = gurusList.filter((g) => {
    const matchesSearch = !userSearchQuery.trim() || 
      g.full_name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (g.city && g.city.toLowerCase().includes(userSearchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (userStatusFilter === "active") return !g.is_suspended;
    if (userStatusFilter === "suspended") return g.is_suspended;
    return true;
  });

  const filteredShishyas = shishyasList.filter((s) => {
    const matchesSearch = !userSearchQuery.trim() || 
      s.full_name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (s.city && s.city.toLowerCase().includes(userSearchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (userStatusFilter === "active") return !s.is_suspended;
    if (userStatusFilter === "suspended") return s.is_suspended;
    return true;
  });

  // Filter Posts List
  const filteredPosts = posts.filter((p) => {
    if (!postSearchQuery.trim()) return true;
    const q = postSearchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || (p.author?.full_name && p.author.full_name.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-parchment-border">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-espresso text-cream-100 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-antiqueGold" />
              <span>Admin Management Sanctum</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-espresso">
              Platform Administration
            </h1>
            <p className="text-xs text-espresso/60 mt-1">
              Curate lineages, moderate cultural works, and uphold community standards.
            </p>
          </div>

          {/* Top Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setActiveTab("gurus"); setUserSearchQuery(""); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "gurus"
                  ? "bg-espresso text-cream shadow-subtle"
                  : "bg-white text-espresso/70 border border-parchment-border hover:bg-cream-100"
              }`}
            >
              <span>Gurus ({gurusList.length})</span>
              {pendingGurus.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingGurus.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("shishyas"); setUserSearchQuery(""); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "shishyas"
                  ? "bg-espresso text-cream shadow-subtle"
                  : "bg-white text-espresso/70 border border-parchment-border hover:bg-cream-100"
              }`}
            >
              <span>Shishyas ({shishyasList.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab("posts"); setPostSearchQuery(""); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "posts"
                  ? "bg-espresso text-cream shadow-subtle"
                  : "bg-white text-espresso/70 border border-parchment-border hover:bg-cream-100"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-copper-400" />
              <span>Posts Moderation</span>
              {postCounts.resubmitted > 0 && (
                <span className="bg-copper text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {postCounts.resubmitted}
                </span>
              )}
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs rounded-2xl flex items-center justify-between gap-2 shadow-subtle animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg("")}
              className="text-xs text-green-700 hover:text-green-900 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: GURUS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === "gurus" && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* PENDING GURU APPLICATIONS BLOCK AT TOP */}
            {pendingGurus.length > 0 && (
              <section className="bg-amber-50/70 border border-amber-300 p-6 rounded-3xl shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
                    <h2 className="font-serif text-lg font-bold text-amber-950">
                      Pending Guru Lineage Applications ({pendingGurus.length})
                    </h2>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase">
                    Requires Curatorial Review
                  </span>
                </div>

                <div className="space-y-4">
                  {pendingGurus.map((guru) => (
                    <div
                      key={guru.id}
                      className="bg-white p-5 rounded-2xl border border-amber-200 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar
                          name={guru.full_name}
                          avatarUrl={guru.avatar_url}
                          role="guru"
                          size="lg"
                        />
                        <div className="space-y-1">
                          <h3 className="font-serif text-base font-bold text-espresso">{guru.full_name}</h3>
                          <p className="text-xs text-espresso/70 italic max-w-lg">
                            {guru.bio || "No lineage biography provided."}
                          </p>
                          <p className="text-[11px] text-espresso/50">
                            {guru.city || "Sangam"} &bull; Languages: {guru.languages?.join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                        <Link
                          href={`/profile/${guru.id}`}
                          className="px-3 py-1.5 text-xs font-semibold text-espresso/70 border border-parchment-border rounded-xl hover:bg-cream-100"
                        >
                          Profile
                        </Link>
                        <button
                          onClick={() => handleGuruDecision(guru.id, "reject")}
                          disabled={actionLoadingId === guru.id}
                          className="px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleGuruDecision(guru.id, "approve")}
                          disabled={actionLoadingId === guru.id}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-green-700 hover:bg-green-800 rounded-xl shadow-subtle flex items-center gap-1.5"
                        >
                          {actionLoadingId === guru.id && <Loader2 className="w-3 h-3 animate-spin" />}
                          <span>Approve</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* GURUS ROSTER WITH FILTERS & SEARCH */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUserStatusFilter("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      userStatusFilter === "all"
                        ? "bg-copper text-white shadow-subtle"
                        : "text-espresso/70 hover:bg-cream-100 border border-parchment-border"
                    }`}
                  >
                    All Gurus ({gurusList.length})
                  </button>
                  <button
                    onClick={() => setUserStatusFilter("active")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      userStatusFilter === "active"
                        ? "bg-copper text-white shadow-subtle"
                        : "text-espresso/70 hover:bg-cream-100 border border-parchment-border"
                    }`}
                  >
                    Active ({gurusList.filter(g => !g.is_suspended).length})
                  </button>
                  <button
                    onClick={() => setUserStatusFilter("suspended")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                      userStatusFilter === "suspended"
                        ? "bg-red-600 text-white shadow-subtle"
                        : "text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
                    }`}
                  >
                    <UserX className="w-3 h-3" />
                    <span>Suspended ({gurusList.filter(g => g.is_suspended).length})</span>
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-espresso/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search gurus by name..."
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-parchment-border bg-white focus:outline-none focus:ring-2 focus:ring-copper"
                  />
                </div>
              </div>

              {usersLoading ? (
                <div className="bg-white p-12 rounded-2xl border border-parchment-border text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-copper mx-auto mb-2" />
                  <p className="text-xs text-espresso/60 font-serif">Loading mentors...</p>
                </div>
              ) : filteredGurus.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-parchment-border text-center space-y-2">
                  <Users className="w-8 h-8 text-espresso/30 mx-auto" />
                  <h3 className="font-serif text-base font-bold text-espresso">No gurus found</h3>
                  <p className="text-xs text-espresso/60">No guru accounts match the selected filters or search.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredGurus.map((guru) => (
                    <div
                      key={guru.id}
                      className={`bg-white p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        guru.is_suspended ? "border-red-200 bg-red-50/20" : "border-parchment-border hover:border-copper/40"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Avatar
                          name={guru.full_name}
                          avatarUrl={guru.avatar_url}
                          role="guru"
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-serif font-bold text-sm text-espresso truncate">
                              {guru.full_name}
                            </span>
                            <RoleBadge
                              role="guru"
                              isVerified={guru.is_verified}
                              guruStatus={guru.guru_status}
                              size="sm"
                            />
                            {guru.is_suspended && (
                              <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase">
                                Suspended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-espresso/60 truncate mt-0.5">
                            {guru.city || "India"} &bull; {guru.languages?.join(", ") || "Hindi"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                        <Link
                          href={`/profile/${guru.id}`}
                          className="px-3 py-1.5 text-xs font-semibold text-espresso/70 border border-parchment-border rounded-xl hover:bg-cream-100 transition-colors"
                        >
                          Profile
                        </Link>
                        {guru.is_suspended ? (
                          <button
                            onClick={() => setConfirmModal({ user: guru, action: "reactivate" })}
                            className="px-3.5 py-1.5 text-xs font-bold text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-all"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmModal({ user: guru, action: "suspend" })}
                            className="px-3.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SHISHYAS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === "shishyas" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUserStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    userStatusFilter === "all"
                      ? "bg-copper text-white shadow-subtle"
                      : "text-espresso/70 hover:bg-cream-100 border border-parchment-border"
                  }`}
                >
                  All Shishyas ({shishyasList.length})
                </button>
                <button
                  onClick={() => setUserStatusFilter("active")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    userStatusFilter === "active"
                      ? "bg-copper text-white shadow-subtle"
                      : "text-espresso/70 hover:bg-cream-100 border border-parchment-border"
                  }`}
                >
                  Active ({shishyasList.filter(s => !s.is_suspended).length})
                </button>
                <button
                  onClick={() => setUserStatusFilter("suspended")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                    userStatusFilter === "suspended"
                      ? "bg-red-600 text-white shadow-subtle"
                      : "text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
                  }`}
                >
                  <UserX className="w-3 h-3" />
                  <span>Suspended ({shishyasList.filter(s => s.is_suspended).length})</span>
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-espresso/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search shishyas by name..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-parchment-border bg-white focus:outline-none focus:ring-2 focus:ring-copper"
                />
              </div>
            </div>

            {usersLoading ? (
              <div className="bg-white p-12 rounded-2xl border border-parchment-border text-center">
                <Loader2 className="w-6 h-6 animate-spin text-copper mx-auto mb-2" />
                <p className="text-xs text-espresso/60 font-serif">Loading apprentices...</p>
              </div>
            ) : filteredShishyas.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-parchment-border text-center space-y-2">
                <Users className="w-8 h-8 text-espresso/30 mx-auto" />
                <h3 className="font-serif text-base font-bold text-espresso">No shishyas found</h3>
                <p className="text-xs text-espresso/60">No shishya accounts match the selected filters or search.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredShishyas.map((shishya) => (
                  <div
                    key={shishya.id}
                    className={`bg-white p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      shishya.is_suspended ? "border-red-200 bg-red-50/20" : "border-parchment-border hover:border-copper/40"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Avatar
                        name={shishya.full_name}
                        avatarUrl={shishya.avatar_url}
                        role="shishya"
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-bold text-sm text-espresso truncate">
                            {shishya.full_name}
                          </span>
                          <RoleBadge role="shishya" size="sm" />
                          {shishya.is_suspended && (
                            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase">
                              Suspended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-espresso/60 truncate mt-0.5">
                          {shishya.city || "Varanasi"} &bull; Registered {new Date(shishya.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      <Link
                        href={`/profile/${shishya.id}`}
                        className="px-3 py-1.5 text-xs font-semibold text-espresso/70 border border-parchment-border rounded-xl hover:bg-cream-100 transition-colors"
                      >
                        Profile
                      </Link>
                      {shishya.is_suspended ? (
                        <button
                          onClick={() => setConfirmModal({ user: shishya, action: "reactivate" })}
                          className="px-3.5 py-1.5 text-xs font-bold text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-all"
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({ user: shishya, action: "suspend" })}
                          className="px-3.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: POSTS MODERATION QUEUE */}
        {/* ============================================================== */}
        {activeTab === "posts" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Sub-tabs: Resubmitted, Suspended, All */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-parchment-border pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPostTab("resubmitted")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    postTab === "resubmitted"
                      ? "bg-espresso text-cream shadow-subtle"
                      : "text-espresso/70 hover:bg-cream-100 border border-parchment-border"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-antiqueGold" />
                  <span>Resubmitted ({postCounts.resubmitted})</span>
                </button>

                <button
                  onClick={() => setPostTab("suspended")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    postTab === "suspended"
                      ? "bg-red-700 text-white shadow-subtle"
                      : "text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Suspended ({postCounts.suspended})</span>
                </button>

                <button
                  onClick={() => setPostTab("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    postTab === "all"
                      ? "bg-copper text-white shadow-subtle"
                      : "text-espresso/70 hover:bg-cream-100 border border-parchment-border"
                  }`}
                >
                  All Works ({postCounts.all})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-espresso/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={postSearchQuery}
                  onChange={(e) => setPostSearchQuery(e.target.value)}
                  placeholder="Search works or author..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-parchment-border bg-white focus:outline-none focus:ring-2 focus:ring-copper"
                />
              </div>
            </div>

            {postsLoading ? (
              <div className="bg-white p-12 rounded-2xl border border-parchment-border text-center">
                <Loader2 className="w-6 h-6 animate-spin text-copper mx-auto mb-2" />
                <p className="text-xs text-espresso/60 font-serif">Loading moderation queue...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-parchment-border text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                <h3 className="font-serif text-base font-bold text-espresso">
                  {postTab === "resubmitted" ? "No works awaiting review" : "No posts found"}
                </h3>
                <p className="text-xs text-espresso/60">
                  {postTab === "resubmitted" 
                    ? "All artist resubmissions have been curated and reviewed." 
                    : "No posts match the active filter or search query."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className={`bg-white p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-subtle ${
                      post.status === "suspended"
                        ? "border-red-200 bg-red-50/10"
                        : post.status === "pending_review"
                        ? "border-amber-300 bg-amber-50/20"
                        : "border-parchment-border hover:border-copper/40"
                    }`}
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-copper-800 bg-copper-50 px-2.5 py-0.5 rounded-full uppercase">
                          {post.category === "poetry" ? <Feather className="w-3 h-3" /> : <Music className="w-3 h-3" />}
                          <span>{post.category}</span>
                        </span>
                        <span className="text-[11px] text-espresso/70 bg-cream-100 px-2.5 py-0.5 rounded-full font-medium">
                          {post.language}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          post.status === "suspended"
                            ? "bg-red-100 text-red-800 border border-red-300"
                            : post.status === "pending_review"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-green-100 text-green-800 border border-green-300"
                        }`}>
                          {post.status || "published"}
                        </span>
                        <span className="text-[11px] text-espresso/40">
                          {new Date(post.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>

                      <div>
                        <Link
                          href={`/posts/${post.id}`}
                          className="font-serif font-bold text-base text-espresso hover:text-copper transition-colors truncate block"
                        >
                          “{post.title}”
                        </Link>
                        <p className="text-xs text-espresso/60 flex items-center gap-2 mt-0.5">
                          <span>By: <strong className="text-espresso">{post.author?.full_name || "Unknown Artist"}</strong></span>
                          <span>&bull;</span>
                          <span>Role: {post.author?.role || "shishya"}</span>
                        </p>
                      </div>

                      {post.moderation_reason && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900">
                          <strong>Moderation Reason:</strong> {post.moderation_reason}
                        </div>
                      )}
                    </div>

                    {/* Post Action Buttons */}
                    <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0 flex-wrap">
                      <Link
                        href={`/posts/${post.id}`}
                        className="px-3 py-1.5 text-xs font-semibold text-espresso/70 border border-parchment-border rounded-xl hover:bg-cream-100 transition-colors"
                      >
                        View Post
                      </Link>

                      {/* Resubmitted (Pending Review) Actions: Approve or Reject */}
                      {post.status === "pending_review" && (
                        <>
                          <button
                            onClick={() => handlePostDirectAction(post.id, "approve")}
                            disabled={actionLoadingId === post.id}
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-green-700 hover:bg-green-800 rounded-xl shadow-subtle flex items-center gap-1.5 transition-all"
                          >
                            {actionLoadingId === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setPostModal({ action: "reject", post })}
                            className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-all"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* Suspended Actions: Restore */}
                      {post.status === "suspended" && (
                        <button
                          onClick={() => handlePostDirectAction(post.id, "restore")}
                          disabled={actionLoadingId === post.id}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-green-700 hover:bg-green-800 rounded-xl shadow-subtle flex items-center gap-1.5 transition-all"
                        >
                          {actionLoadingId === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                          <span>Restore</span>
                        </button>
                      )}

                      {/* If post is published: Allow Suspend */}
                      {(!post.status || post.status === "published") && (
                        <button
                          onClick={() => setPostModal({ action: "suspend", post })}
                          className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-all flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Suspend post</span>
                        </button>
                      )}

                      {/* Delete permanently always visible to admin */}
                      <button
                        onClick={() => setPostModal({ action: "delete", post })}
                        className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete permanently</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* CONFIRM MODAL FOR USER SUSPENSION / REACTIVATION */}
        {/* ============================================================== */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl border border-parchment-border shadow-floating max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    confirmModal.action === "suspend"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {confirmModal.action === "suspend" ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <UserCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-espresso">
                    {confirmModal.action === "suspend" 
                      ? "Confirm Account Suspension" 
                      : "Confirm Reactivation"}
                  </h3>
                  <p className="text-xs text-espresso/60">
                    Target User: <span className="font-bold text-espresso">{confirmModal.user.full_name}</span>
                  </p>
                </div>
              </div>

              <div className="p-4 bg-cream-50 rounded-2xl border border-parchment-border/80 text-xs text-espresso/80 leading-relaxed">
                {confirmModal.action === "suspend" ? (
                  <p>
                    Are you sure you want to suspend <strong className="text-espresso">{confirmModal.user.full_name}</strong>? 
                    Their profile and works will be hidden from public Explore, and they will be blocked from logging in.
                  </p>
                ) : (
                  <p>
                    Reactivate <strong className="text-espresso">{confirmModal.user.full_name}</strong>? 
                    This will immediately restore their access to log in and unhide their artistic profile and works.
                  </p>
                )}
              </div>

              {confirmModal.action === "suspend" && (
                <div>
                  <label className="block text-xs font-semibold text-espresso mb-1">
                    Suspension Reason (Recorded in audit trail)
                  </label>
                  <input
                    type="text"
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="e.g. Violation of artistic community guidelines..."
                    className="w-full text-xs p-2.5 rounded-xl border border-parchment-border bg-white focus:outline-none focus:ring-2 focus:ring-copper"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => { setConfirmModal(null); setSuspendReason(""); }}
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-xl border border-parchment-border text-xs font-semibold text-espresso/70 hover:bg-cream-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeSuspensionToggle}
                  disabled={modalLoading}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-subtle flex items-center gap-2 ${
                    confirmModal.action === "suspend"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-700 hover:bg-green-800"
                  }`}
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {confirmModal.action === "suspend" ? "Yes, Suspend Account" : "Yes, Reactivate"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* POST ACTION MODAL (SUSPEND, DELETE, REJECT) */}
        {postModal && (
          <AdminPostActionModal
            isOpen={!!postModal}
            action={postModal.action}
            post={postModal.post}
            onClose={() => setPostModal(null)}
            onSuccess={(msg) => {
              setFeedbackMsg(msg);
              loadPostsData();
            }}
          />
        )}
      </main>
    </div>
  );
}

export default function AdminSanctumPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-copper" />
        </div>
      }
    >
      <AdminSanctumContent />
    </Suspense>
  );
}
