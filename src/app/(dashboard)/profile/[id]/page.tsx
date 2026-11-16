"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  MapPin, 
  ArrowLeft, 
  Feather, 
  GraduationCap, 
  Loader2, 
  Globe 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile, Post } from "@/lib/types/database.types";
import { Navbar } from "@/components/layout/Navbar";
import { RoleBadge } from "@/components/common/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PostCard } from "@/components/posts/PostCard";
import { ContactDetailsView } from "@/components/connect/ContactDetailsView";
import { UserX, UserCheck } from "lucide-react";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  const handleAdminAction = async (action: "suspend" | "reactivate") => {
    if (!profile) return;
    const confirmText = action === "suspend"
      ? `Are you sure you want to suspend ${profile.full_name}? This will remove them from public Explore and block their login.`
      : `Reactivate ${profile.full_name}?`;

    if (!window.confirm(confirmText)) return;

    setAdminActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ userId: profile.id, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      alert(data.message);
      setProfile({
        ...profile,
        is_suspended: action === "suspend",
        suspended_at: action === "suspend" ? new Date().toISOString() : null
      });
    } catch (err: any) {
      alert(err.message || "Failed to execute admin action");
    } finally {
      setAdminActionLoading(false);
    }
  };

  useEffect(() => {
    async function loadArtist() {
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

        // Fetch target artist profile and works via secure server endpoint
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`/api/profile/${profileId}`, {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        const data = await res.json();

        if (!res.ok || !data.profile) {
          console.error("Artist profile error:", data.error);
          setLoading(false);
          return;
        }

        setProfile(data.profile as Profile);
        setPosts(data.posts || []);
      } catch (err) {
        console.error("Public profile load error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (profileId) {
      loadArtist();
    }
  }, [profileId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-copper animate-spin mb-2" />
        <p className="text-sm text-espresso/70">Invoking artist lineage...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="font-serif text-2xl font-bold text-espresso mb-2">Artist Not Found</h2>
          <Link href="/explore" className="px-5 py-2.5 bg-copper text-white rounded-xl text-xs font-semibold">
            Back to Explore
          </Link>
        </main>
      </div>
    );
  }

  const isViewerGuru = currentUserProfile?.role === "guru";
  const isTargetShishya = profile.role === "shishya";

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="mb-2">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-espresso/60 hover:text-copper transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Artist Header Banner */}
        <div className="bg-white rounded-3xl border border-parchment-border shadow-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar
                name={profile.full_name}
                avatarUrl={profile.avatar_url}
                role={profile.role}
                size="2xl"
              />

              <div>
                <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso">
                    {profile.full_name}
                  </h1>
                  <RoleBadge
                    role={profile.role}
                    isVerified={profile.is_verified}
                    guruStatus={profile.guru_status}
                    size="md"
                  />
                  {profile.is_suspended && (
                    <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2.5 py-0.5 rounded-full">
                      Account Suspended
                    </span>
                  )}
                </div>
                {profile.role !== "admin" && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-espresso/60">
                    {profile.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-copper-600" />
                        <span>{profile.city}</span>
                      </span>
                    )}
                    {profile.languages && profile.languages.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-copper-600" />
                        <span>{profile.languages.join(", ")}</span>
                      </span>
                    )}
                  </div>
                )}
                {profile.bio && (
                  <p className="text-xs text-espresso/80 mt-2.5 max-w-xl leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-3">
              {profile.role !== "admin" && (
                <div className="text-right sm:text-left">
                  <span className="text-[11px] text-espresso/50 block">Artistic Contributions</span>
                  <span className="text-base font-serif font-bold text-espresso">
                    {posts.length} {posts.length === 1 ? "Work" : "Works"}
                  </span>
                </div>
              )}

              {/* Direct Admin Control Button */}
              {currentUserProfile?.role === "admin" && profile.role !== "admin" && (
                <div className="pt-1">
                  {profile.is_suspended ? (
                    <button
                      onClick={() => handleAdminAction("reactivate")}
                      disabled={adminActionLoading}
                      className="px-4 py-2 rounded-xl bg-green-700 text-white text-xs font-semibold hover:bg-green-800 transition-all shadow-subtle flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Reactivate Artist</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAdminAction("suspend")}
                      disabled={adminActionLoading}
                      className="px-4 py-2 rounded-xl border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition-all shadow-subtle flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Suspend / Remove User</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Unlocking Section for Gurus */}
        {isViewerGuru && isTargetShishya && (
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-bold text-espresso">
              Mentorship Lineage Contact
            </h3>
            <ContactDetailsView
              shishyaId={profile.id}
              isConnectedGuru={true}
            />
          </div>
        )}

        {/* Published Works Section */}
        {profile.role !== "admin" && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Published Works ({posts.length})
            </h2>

            {posts.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-parchment-border text-center space-y-2">
                <Feather className="w-8 h-8 text-espresso/30 mx-auto" />
                <p className="text-xs text-espresso/60">No creations published yet by this artist.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUser?.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

