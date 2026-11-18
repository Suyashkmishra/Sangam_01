"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Instagram, 
  Lock, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Loader2, 
  Save, 
  Feather, 
  Music, 
  CreditCard, 
  AlertCircle, 
  GraduationCap,
  ShieldAlert,
  Send
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile, ProfileContact, Post, Connection, Payment } from "@/lib/types/database.types";
import { Navbar } from "@/components/layout/Navbar";
import { RoleBadge } from "@/components/common/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PostCard } from "@/components/posts/PostCard";
import { EditAndResubmitModal } from "@/components/posts/EditAndResubmitModal";

export default function MyProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contacts, setContacts] = useState<ProfileContact | null>(null);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [connections, setConnections] = useState<(Connection & { guru?: Profile; shishya?: Profile; post?: Post })[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<"works" | "contacts" | "connections" | "payments">("works");

  // Edit profile form
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState("");

  // Contact form
  const [whatsapp, setWhatsapp] = useState("");
  const [insta, setInsta] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [prefChannel, setPrefChannel] = useState<"whatsapp" | "instagram" | "email">("whatsapp");
  const [savingContacts, setSavingContacts] = useState(false);
  const [contactSavedMsg, setContactSavedMsg] = useState("");

  // Post moderation editing state
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [resubmitNotice, setResubmitNotice] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setUser(user);

        // Fetch profile
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (prof) {
          const p = prof as Profile;
          setProfile(p);
          setFullName(p.full_name || "");
          setBio(p.bio || "");
          setCity(p.city || "");
        }

        // Fetch contacts
        const { data: cont } = await supabase
          .from("profile_contacts")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cont) {
          const c = cont as ProfileContact;
          setContacts(c);
          setWhatsapp(c.contact_whatsapp || "");
          setInsta(c.contact_instagram || "");
          setContactEmail(c.contact_email || user.email || "");
          setPrefChannel(c.preferred_channel || "whatsapp");
        } else {
          setContactEmail(user.email || "");
        }

        // Fetch own posts
        const { data: postsData } = await supabase
          .from("posts")
          .select("*, author:profiles!posts_author_id_fkey(*), likes(count), comments(count)")
          .eq("author_id", user.id)
          .order("created_at", { ascending: false });

        if (postsData) {
          setMyPosts(postsData.map((p: any) => ({
            ...p,
            likes_count: p.likes?.[0]?.count || 0,
            comments_count: p.comments?.[0]?.count || 0,
          })));
        }

        // Fetch connections
        const isGuru = prof?.role === "guru";
        const queryField = isGuru ? "guru_id" : "shishya_id";
        const { data: connData } = await supabase
          .from("connections")
          .select("*, guru:profiles!connections_guru_id_fkey(*), shishya:profiles!connections_shishya_id_fkey(*), post:posts(*)")
          .eq(queryField, user.id)
          .order("created_at", { ascending: false });

        if (connData) setConnections(connData as any);

        // Fetch payments
        const { data: payData } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (payData) setPayments(payData as Payment[]);
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  // Handle Profile Update (Bio, City, Full Name)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileSavedMsg("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          bio: bio.trim(),
          city: city.trim(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfileSavedMsg("Artist profile updated successfully!");
      setTimeout(() => setProfileSavedMsg(""), 3000);
    } catch (err: any) {
      console.error("Save profile error:", err);
      alert(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Contact Settings Update
  const handleSaveContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingContacts(true);
    setContactSavedMsg("");

    try {
      const { error } = await supabase
        .from("profile_contacts")
        .upsert({
          user_id: user.id,
          contact_whatsapp: whatsapp.trim() || null,
          contact_instagram: insta.trim() || null,
          contact_email: contactEmail.trim() || null,
          preferred_channel: prefChannel,
        });

      if (error) throw error;

      setContactSavedMsg("Confidential contact preferences saved!");
      setTimeout(() => setContactSavedMsg(""), 3000);
    } catch (err: any) {
      console.error("Save contacts error:", err);
      alert(err.message || "Failed to save contacts");
    } finally {
      setSavingContacts(false);
    }
  };

  // Handle Connection Status Update (Accept / Reject by Shishya)
  const handleConnectionAction = async (connectionId: string, status: "accepted" | "rejected") => {
    try {
      const { error } = await supabase
        .from("connections")
        .update({ status: status })
        .eq("id", connectionId);

      if (error) throw error;

      // Update state locally
      setConnections(
        connections.map((c) => (c.id === connectionId ? { ...c, status } : c))
      );
    } catch (err: any) {
      console.error("Connection update error:", err);
      alert(err.message || "Failed to update connection status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-copper animate-spin mb-2" />
        <p className="text-sm text-espresso/70">Gathering your artist folio...</p>
      </div>
    );
  }

  const isGuru = profile?.role === "guru";

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl border border-parchment-border shadow-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar
                name={profile?.full_name}
                avatarUrl={profile?.avatar_url}
                role={profile?.role}
                size="2xl"
              />

              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso">
                    {profile?.full_name}
                  </h1>
                  <RoleBadge
                    role={profile?.role}
                    isVerified={profile?.is_verified}
                    guruStatus={profile?.guru_status}
                    size="md"
                  />
                </div>
                {profile?.role !== "admin" && (
                  <p className="text-xs text-espresso/60 flex items-center gap-2">
                    <span>{user?.email}</span>
                    {profile?.city && (
                      <>
                        <span>&bull;</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-copper-600" />
                          {profile.city}
                        </span>
                      </>
                    )}
                  </p>
                )}
                {profile?.bio && (
                  <p className="text-xs text-espresso/80 mt-2.5 max-w-xl leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {profile?.role !== "admin" && (
              <div className="text-right sm:text-left">
                <span className="text-[11px] text-espresso/50 block">Artistic Lineage</span>
                <span className="text-xs font-semibold text-copper-800 capitalize">
                  {profile?.role === "guru" ? "Master Mentor" : "Emerging Voice"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation and Content (Guru and Shishya only) */}
        {profile?.role !== "admin" && (
          <>
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-parchment-border pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("works")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "works"
                ? "bg-copper text-white shadow-subtle"
                : "text-espresso/70 hover:text-espresso hover:bg-cream-100"
            }`}
          >
            My Works ({myPosts.length})
          </button>

          <button
            onClick={() => setActiveTab("connections")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "connections"
                ? "bg-copper text-white shadow-subtle"
                : "text-espresso/70 hover:text-espresso hover:bg-cream-100"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{isGuru ? "Sent Invitations" : "Mentorship Requests"} ({connections.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("contacts")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "contacts"
                ? "bg-copper text-white shadow-subtle"
                : "text-espresso/70 hover:text-espresso hover:bg-cream-100"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Contact Privacy Settings</span>
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "payments"
                ? "bg-copper text-white shadow-subtle"
                : "text-espresso/70 hover:text-espresso hover:bg-cream-100"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Receipts</span>
          </button>
        </div>

        {/* TAB CONTENT */}

        {/* 1. MY WORKS */}
        {activeTab === "works" && (
          <div className="space-y-4">
            {resubmitNotice && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs rounded-2xl flex items-center justify-between gap-2 shadow-subtle animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>{resubmitNotice}</span>
                </div>
                <button
                  onClick={() => setResubmitNotice("")}
                  className="text-xs text-green-700 hover:text-green-900 font-bold"
                >
                  &times;
                </button>
              </div>
            )}

            {myPosts.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-parchment-border text-center space-y-3">
                <Feather className="w-8 h-8 text-espresso/30 mx-auto" />
                <h3 className="font-serif text-lg font-bold text-espresso">No creations published yet</h3>
                <p className="text-xs text-espresso/60 max-w-sm mx-auto">
                  Share your first poem or musical performance with the Sangam mentors.
                </p>
                <button
                  onClick={() => router.push("/posts/create")}
                  className="px-5 py-2.5 bg-copper text-white rounded-xl text-xs font-semibold hover:bg-copper-600 transition-all shadow-subtle"
                >
                  Publish Creation
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myPosts.map((post) => (
                  <div key={post.id} className="flex flex-col">
                    <PostCard
                      post={post}
                      currentUserId={user?.id}
                    />

                    {/* Suspended Moderation Card Banner */}
                    {post.status === "suspended" && (
                      <div className="mt-2.5 p-3.5 bg-red-50/90 border border-red-200 rounded-2xl shadow-subtle space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-800 bg-red-100/90 border border-red-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-700" />
                            <span>Suspended</span>
                          </span>
                          <button
                            onClick={() => setEditingPost(post)}
                            className="px-3 py-1 bg-copper hover:bg-copper-600 text-white rounded-xl text-xs font-semibold transition-all shadow-subtle flex items-center gap-1"
                          >
                            <span>Edit & Resubmit</span>
                          </button>
                        </div>
                        {post.moderation_reason && (
                          <p className="text-xs text-red-900/90 italic pl-1 leading-relaxed">
                            Reason: {post.moderation_reason}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Pending Review Badge */}
                    {post.status === "pending_review" && (
                      <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-subtle">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                          <span>Pending Review</span>
                        </span>
                        <span className="text-[11px] text-amber-900/80 font-medium">Under guardian curation</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. CONNECTIONS */}
        {activeTab === "connections" && (
          <div className="space-y-4">
            {connections.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-parchment-border text-center space-y-2">
                <GraduationCap className="w-8 h-8 text-espresso/30 mx-auto" />
                <h3 className="font-serif text-lg font-bold text-espresso">
                  {isGuru ? "No Mentorship Invitations Sent" : "No Mentorship Requests Received"}
                </h3>
                <p className="text-xs text-espresso/60 max-w-sm mx-auto">
                  {isGuru
                    ? "Browse through young shishyas' creations in Explore and click 'Connect' to offer guidance."
                    : "When an established Guru reads your verses and initiates mentorship, their note will appear here."}
                </p>
              </div>
            ) : (
              connections.map((conn) => {
                const otherParty = isGuru ? conn.shishya : conn.guru;
                const isPending = conn.status === "pending";

                return (
                  <div
                    key={conn.id}
                    className="bg-white p-6 rounded-2xl border border-parchment-border shadow-subtle space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={otherParty?.full_name}
                          avatarUrl={otherParty?.avatar_url}
                          role={otherParty?.role}
                          size="md"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-espresso">
                              {otherParty?.full_name}
                            </h4>
                            <RoleBadge
                              role={otherParty?.role}
                              isVerified={otherParty?.is_verified}
                              guruStatus={otherParty?.guru_status}
                              size="sm"
                            />
                          </div>
                          {conn.post && (
                            <p className="text-[11px] text-espresso/60">
                              Regarding work: <span className="font-semibold italic">"{conn.post.title}"</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div>
                        {conn.status === "accepted" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Accepted</span>
                          </span>
                        ) : conn.status === "rejected" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Declined</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                            <span>Pending Review</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Note text */}
                    <div className="bg-cream-50 p-4 rounded-xl border border-parchment-border text-xs text-espresso/80 leading-relaxed">
                      <p className="font-semibold text-espresso/60 text-[10px] uppercase tracking-wider mb-1">
                        Mentor Note:
                      </p>
                      <p className="italic">"{conn.note}"</p>
                    </div>

                    {/* Actions for Shishya if pending */}
                    {!isGuru && isPending && (
                      <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleConnectionAction(conn.id, "rejected")}
                          className="px-4 py-2 border border-parchment-border hover:bg-cream-100 text-espresso/70 rounded-xl text-xs font-medium transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleConnectionAction(conn.id, "accepted")}
                          className="px-5 py-2 bg-copper text-white rounded-xl text-xs font-semibold hover:bg-copper-600 transition-all shadow-subtle flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Accept & Reveal Contact Line</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 3. CONTACT PRIVACY SETTINGS */}
        {activeTab === "contacts" && (
          <div className="bg-white rounded-3xl border border-parchment-border p-6 sm:p-8 shadow-subtle space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-5 h-5 text-copper-600" />
                <h3 className="font-serif text-2xl font-bold text-espresso">
                  Confidential Contact Information
                </h3>
              </div>
              <p className="text-xs text-espresso/70 max-w-xl leading-relaxed">
                Your contact details are stored in an isolated table (<code className="bg-cream-100 px-1 py-0.5 rounded text-copper-800">profile_contacts</code>) and guarded by PostgreSQL Row-Level Security. They are <strong>never</strong> public and are revealed solely to Gurus whose mentorship connections you have explicitly accepted.
              </p>
            </div>

            <form onSubmit={handleSaveContacts} className="space-y-5 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-espresso/80 mb-1">
                  WhatsApp Contact Number
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-espresso/40">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="block w-full pl-10 pr-3 py-2 text-sm bg-cream-50/50 border border-parchment-border rounded-xl text-espresso focus:outline-none focus:border-copper"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso/80 mb-1">
                  Instagram Handle
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-espresso/40">
                    <Instagram className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={insta}
                    onChange={(e) => setInsta(e.target.value)}
                    placeholder="@your_handle"
                    className="block w-full pl-10 pr-3 py-2 text-sm bg-cream-50/50 border border-parchment-border rounded-xl text-espresso focus:outline-none focus:border-copper"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso/80 mb-1">
                  Contact Email Address
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-espresso/40">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="artist@example.com"
                    className="block w-full pl-10 pr-3 py-2 text-sm bg-cream-50/50 border border-parchment-border rounded-xl text-espresso focus:outline-none focus:border-copper"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso/80 mb-1.5">
                  Preferred Contact Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["whatsapp", "instagram", "email"] as const).map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => setPrefChannel(channel)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                        prefChannel === channel
                          ? "border-copper bg-copper-50 text-copper-800 font-bold"
                          : "border-parchment-border text-espresso/70 hover:bg-cream-50"
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>

              {contactSavedMsg && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{contactSavedMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingContacts}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-copper text-white rounded-xl text-xs font-semibold hover:bg-copper-600 transition-all shadow-subtle disabled:opacity-60"
              >
                {savingContacts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Contact Privacy Settings</span>
              </button>
            </form>
          </div>
        )}

        {/* 4. PAYMENT RECEIPTS */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-3xl border border-parchment-border p-6 sm:p-8 shadow-subtle space-y-4">
            <div>
              <h3 className="font-serif text-2xl font-bold text-espresso mb-1">
                Initiation Fee Records
              </h3>
              <p className="text-xs text-espresso/60">
                Simulated college demo payment audits recorded in the database.
              </p>
            </div>

            {payments.length === 0 ? (
              <p className="text-xs text-espresso/50 italic py-6">No payments recorded yet.</p>
            ) : (
              <div className="divide-y divide-parchment-border">
                {payments.map((p) => (
                  <div key={p.id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-espresso capitalize">
                        {p.plan.replace("_", " ")}
                      </p>
                      <p className="text-[11px] text-espresso/50">
                        {new Date(p.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })} &bull; {p.mock ? "Simulated Demo Transaction" : "Gateway"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-serif text-base font-bold text-copper-700">₹{p.amount}</span>
                      <span className="block text-[10px] text-green-700 font-semibold uppercase">
                        ✓ {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
          </>
        )}
      </main>

      {/* Edit & Resubmit Modal for Author */}
      <EditAndResubmitModal
        isOpen={!!editingPost}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSuccess={(msg) => {
          setResubmitNotice(msg);
          if (editingPost) {
            setMyPosts(myPosts.map((p) => p.id === editingPost.id ? { ...p, status: "pending_review" } : p));
          }
        }}
      />
    </div>
  );
}

