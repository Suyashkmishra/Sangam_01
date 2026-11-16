"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  Globe, 
  Loader2, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  Users,
  UserX,
  UserCheck,
  AlertTriangle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types/database.types";
import { Navbar } from "@/components/layout/Navbar";
import { RoleBadge } from "@/components/common/Badge";
import { Avatar } from "@/components/ui/Avatar";

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"verifications" | "users">("verifications");
  const [userFilter, setUserFilter] = useState<"all" | "active" | "suspended">("all");

  // Verifications State
  const [pendingGurus, setPendingGurus] = useState<Profile[]>([]);
  const [approvedGurus, setApprovedGurus] = useState<Profile[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);

  // Users Management State
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    user: Profile;
    action: "suspend" | "reactivate";
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState("");

  const loadData = async () => {
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

      // Fetch pending gurus
      const { data: pendingData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "guru")
        .eq("guru_status", "pending")
        .order("created_at", { ascending: false });

      if (pendingData) setPendingGurus(pendingData as Profile[]);

      // Fetch approved gurus
      const { data: approvedData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "guru")
        .eq("guru_status", "approved")
        .order("created_at", { ascending: false });

      if (approvedData) setApprovedGurus(approvedData as Profile[]);

      // Fetch all users via server API
      loadUsersList();
    } catch (err) {
      console.error("Admin load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsersList = async () => {
    try {
      setUsersLoading(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) {
        setAllUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDecision = async (guruId: string, decision: "approve" | "reject") => {
    setActionId(guruId);
    setFeedbackMsg("");

    try {
      const newStatus = decision === "approve" ? "approved" : "rejected";
      const isVerified = decision === "approve";

      const { error } = await supabase
        .from("profiles")
        .update({
          guru_status: newStatus,
          is_verified: isVerified,
        })
        .eq("id", guruId);

      if (error) throw error;

      setFeedbackMsg(
        decision === "approve"
          ? "Guru application approved. Verified Guru badge awarded."
          : "Guru application rejected."
      );

      // Refresh list
      const updatedPending = pendingGurus.filter((g) => g.id !== guruId);
      setPendingGurus(updatedPending);

      if (decision === "approve") {
        const approvedItem = pendingGurus.find((g) => g.id === guruId);
        if (approvedItem) {
          setApprovedGurus([
            { ...approvedItem, guru_status: "approved", is_verified: true },
            ...approvedGurus,
          ]);
        }
      }
      loadUsersList();
    } catch (err: any) {
      console.error("Decision error:", err);
      alert(err.message || "Failed to update guru status.");
    } finally {
      setActionId(null);
    }
  };

  const executeSuspensionToggle = async () => {
    if (!confirmModal) return;
    setModalLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: confirmModal.user.id,
          action: confirmModal.action,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to process suspension request.");
      }

      setFeedbackMsg(result.message);
      setConfirmModal(null);
      await loadUsersList();
    } catch (err: any) {
      alert(err.message || "Failed to perform user action.");
    } finally {
      setModalLoading(false);
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
            You must be signed in with the Admin account to access mentor verification and user management.
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

  // Filtered Users List
  const filteredUsers = allUsers.filter((u) => {
    if (userFilter === "active") return !u.is_suspended;
    if (userFilter === "suspended") return u.is_suspended;
    return true;
  });

  const suspendedCount = allUsers.filter((u) => u.is_suspended).length;

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
              Verify mentor lineages and manage artist platform privileges.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("verifications")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "verifications"
                  ? "bg-espresso text-cream shadow-subtle"
                  : "bg-white text-espresso/70 border border-parchment-border hover:bg-cream-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-antiqueGold" />
              <span>Verifications ({pendingGurus.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "users"
                  ? "bg-espresso text-cream shadow-subtle"
                  : "bg-white text-espresso/70 border border-parchment-border hover:bg-cream-100"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-copper-400" />
              <span>Users ({allUsers.length})</span>
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

        {/* TAB 1: GURU VERIFICATIONS */}
        {activeTab === "verifications" && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* SECTION 1: PENDING GURUS */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                <h2 className="font-serif text-xl font-bold text-espresso">
                  Pending Applications ({pendingGurus.length})
                </h2>
              </div>

              {pendingGurus.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-parchment-border text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                  <h3 className="font-serif text-base font-bold text-espresso">All applications reviewed</h3>
                  <p className="text-xs text-espresso/60">There are no pending Guru mentorship applications.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingGurus.map((guru) => (
                    <div
                      key={guru.id}
                      className="bg-white p-6 rounded-2xl border border-amber-300 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar
                          name={guru.full_name}
                          avatarUrl={guru.avatar_url}
                          role="guru"
                          size="lg"
                        />

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-serif text-lg font-bold text-espresso">
                              {guru.full_name}
                            </h3>
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              Pending Verification
                            </span>
                          </div>

                          <p className="text-xs text-espresso/80 leading-relaxed max-w-xl">
                            {guru.bio || "No biography submitted."}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-espresso/50 pt-1">
                            {guru.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-copper-600" />
                                <span>{guru.city}</span>
                              </span>
                            )}
                            {guru.languages && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3 text-copper-600" />
                                <span>{guru.languages.join(", ")}</span>
                              </span>
                            )}
                            <span>
                              Applied: {new Date(guru.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Approve / Reject Controls */}
                      <div className="flex items-center gap-3 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-parchment-border">
                        <button
                          onClick={() => handleDecision(guru.id, "reject")}
                          disabled={actionId === guru.id}
                          className="px-4 py-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleDecision(guru.id, "approve")}
                          disabled={actionId === guru.id}
                          className="inline-flex items-center gap-1.5 px-5 py-2 bg-antiqueGold text-espresso rounded-xl text-xs font-bold hover:bg-antiqueGold-light transition-all shadow-subtle disabled:opacity-50"
                        >
                          {actionId === guru.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Approve as Verified Guru</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SECTION 2: APPROVED GURUS */}
            <section className="space-y-4 pt-6 border-t border-parchment-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-antiqueGold" />
                <h2 className="font-serif text-xl font-bold text-espresso">
                  Verified Gurus Roster ({approvedGurus.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approvedGurus.map((guru) => (
                  <div
                    key={guru.id}
                    className="bg-white p-5 rounded-2xl border border-parchment-border shadow-subtle flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={guru.full_name}
                        avatarUrl={guru.avatar_url}
                        role="guru"
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="font-serif font-bold text-sm text-espresso truncate">
                          {guru.full_name}
                        </p>
                        <p className="text-[11px] text-espresso/60 truncate">
                          {guru.city || "Sangam Master"} &bull; {guru.languages?.join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <RoleBadge role="guru" isVerified={true} guruStatus="approved" size="sm" />
                      <Link
                        href={`/profile/${guru.id}`}
                        className="p-1.5 rounded-lg text-espresso/40 hover:text-copper hover:bg-cream-100"
                        title="View Profile"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT (SUSPEND / REACTIVATE) */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-parchment-border pb-3">
              <button
                onClick={() => setUserFilter("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  userFilter === "all"
                    ? "bg-copper text-white shadow-subtle"
                    : "text-espresso/70 hover:bg-cream-100"
                }`}
              >
                All Users ({allUsers.length})
              </button>
              <button
                onClick={() => setUserFilter("active")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  userFilter === "active"
                    ? "bg-copper text-white shadow-subtle"
                    : "text-espresso/70 hover:bg-cream-100"
                }`}
              >
                Active ({allUsers.length - suspendedCount})
              </button>
              <button
                onClick={() => setUserFilter("suspended")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  userFilter === "suspended"
                    ? "bg-red-600 text-white shadow-subtle"
                    : "text-red-700 bg-red-50 hover:bg-red-100"
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Suspended ({suspendedCount})</span>
              </button>
            </div>

            {usersLoading ? (
              <div className="bg-white p-12 rounded-2xl border border-parchment-border text-center">
                <Loader2 className="w-6 h-6 animate-spin text-copper mx-auto mb-2" />
                <p className="text-xs text-espresso/60 font-serif">Loading artist directory...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-parchment-border text-center space-y-2">
                <Users className="w-8 h-8 text-espresso/30 mx-auto" />
                <h3 className="font-serif text-base font-bold text-espresso">No users found</h3>
                <p className="text-xs text-espresso/60">
                  {userFilter === "suspended"
                    ? "No users are currently suspended."
                    : "No artists match the selected view."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`bg-white p-4 sm:p-5 rounded-2xl border shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      user.is_suspended 
                        ? "border-red-200 bg-red-50/20" 
                        : "border-parchment-border hover:border-copper/40"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Avatar
                        name={user.full_name}
                        avatarUrl={user.avatar_url}
                        role={user.role}
                        size="md"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-serif font-bold text-base text-espresso truncate">
                            {user.full_name}
                          </h4>
                          <RoleBadge
                            role={user.role}
                            isVerified={user.is_verified}
                            guruStatus={user.guru_status}
                            size="sm"
                          />
                          {user.is_suspended && (
                            <span className="text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <UserX className="w-3 h-3" />
                              Suspended
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-espresso/60 mt-0.5">
                          {user.city ? `${user.city} • ` : ""}
                          Joined {new Date(user.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                          {user.suspended_at && (
                            <span className="text-red-600 block sm:inline sm:ml-2">
                              (Suspended {new Date(user.suspended_at).toLocaleDateString()})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Suspend / Reactivate Controls */}
                    <div className="flex items-center gap-2.5 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-parchment-border">
                      <Link
                        href={`/profile/${user.id}`}
                        className="px-3 py-1.5 rounded-xl border border-parchment-border text-xs text-espresso/70 hover:text-espresso hover:bg-cream-100 transition-colors"
                      >
                        Profile
                      </Link>

                      {user.is_suspended ? (
                        <button
                          onClick={() => setConfirmModal({ user, action: "reactivate" })}
                          className="px-4 py-1.5 rounded-xl bg-green-700 text-white text-xs font-semibold hover:bg-green-800 transition-all shadow-subtle flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Reactivate</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({ user, action: "suspend" })}
                          className="px-4 py-1.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Suspend</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONFIRMATION POPUP MODAL */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl border border-parchment-border p-6 max-w-md w-full shadow-floating space-y-4">
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

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setConfirmModal(null)}
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
      </main>
    </div>
  );
}
