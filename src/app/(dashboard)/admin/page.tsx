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
  ArrowRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types/database.types";
import { Navbar } from "@/components/layout/Navbar";
import { RoleBadge } from "@/components/common/Badge";

export default function AdminVerificationPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingGurus, setPendingGurus] = useState<Profile[]>([]);
  const [approvedGurus, setApprovedGurus] = useState<Profile[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function checkAdminAndLoad() {
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
      } catch (err) {
        console.error("Admin load error:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAdminAndLoad();
  }, [router]);

  const handleDecision = async (guruId: string, decision: "approve" | "reject") => {
    setActionId(guruId);
    setSuccessMsg("");

    const newStatus = decision === "approve" ? "approved" : "rejected";
    const newVerified = decision === "approve";

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          guru_status: newStatus,
          is_verified: newVerified,
        })
        .eq("id", guruId);

      if (error) throw error;

      // Update state locally
      const decidedGuru = pendingGurus.find((g) => g.id === guruId);
      setPendingGurus(pendingGurus.filter((g) => g.id !== guruId));

      if (decidedGuru && decision === "approve") {
        setApprovedGurus([
          { ...decidedGuru, guru_status: "approved", is_verified: true },
          ...approvedGurus,
        ]);
      }

      setSuccessMsg(
        decision === "approve"
          ? `Verified Guru status granted to ${decidedGuru?.full_name || "Artist"}!`
          : `Guru application rejected for ${decidedGuru?.full_name || "Artist"}.`
      );
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error("Decision error:", err);
      alert(err.message || "Failed to update guru status");
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-copper animate-spin mb-2" />
        <p className="text-sm text-espresso/70">Accessing administrative seal...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-espresso mb-2">
            Restricted Admin Sanctum
          </h2>
          <p className="text-xs text-espresso/60 max-w-sm mb-4">
            You must be signed in with the Peethadhish (Admin) account to access mentor verification.
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

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-parchment-border">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-espresso text-cream-100 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-antiqueGold" />
              <span>Council Guardian Panel</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-espresso">
              Guru Mentorship Verifications
            </h1>
            <p className="text-xs text-espresso/60 mt-1">
              Review artist credentials, classical background, and approve "Verified Guru" status.
            </p>
          </div>

          <div className="text-right sm:text-left bg-white px-4 py-2 rounded-xl border border-parchment-border">
            <span className="text-[11px] text-espresso/50 block">Pending Applications</span>
            <span className="font-serif text-xl font-bold text-amber-700">
              {pendingGurus.length} Awaiting
            </span>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs rounded-2xl flex items-center gap-2 shadow-subtle animate-in fade-in duration-150">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

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
                    {guru.avatar_url ? (
                      <img
                        src={guru.avatar_url}
                        alt={guru.full_name}
                        className="w-14 h-14 rounded-2xl object-cover border border-parchment-border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-amber-100 text-antiqueGold-dark flex items-center justify-center font-serif text-xl font-bold flex-shrink-0">
                        {guru.full_name.charAt(0)}
                      </div>
                    )}

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
                  {guru.avatar_url ? (
                    <img
                      src={guru.avatar_url}
                      alt={guru.full_name}
                      className="w-11 h-11 rounded-full object-cover border border-parchment-border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-amber-100 text-antiqueGold-dark flex items-center justify-center font-serif text-base font-bold flex-shrink-0">
                      {guru.full_name.charAt(0)}
                    </div>
                  )}
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
      </main>
    </div>
  );
}

