"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  Heart, 
  MessageSquare, 
  GraduationCap, 
  CheckCircle, 
  XCircle, 
  Check, 
  Loader2, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  FileText
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Notification, Profile, Post, Connection } from "@/lib/types/database.types";
import { Navbar } from "@/components/layout/Navbar";
import { RoleBadge } from "@/components/common/Badge";

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<(Notification & { actor?: Profile; post?: Post; connection?: Connection })[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
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
        if (prof) setUserProfile(prof as Profile);

        // Fetch notifications with actor, post, and connection
        const { data: notifs, error } = await supabase
          .from("notifications")
          .select("*, actor:profiles!notifications_actor_id_fkey(*), post:posts(*), connection:connections(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (notifs) {
          setNotifications(notifs as any);
        }
      } catch (err) {
        console.error("Notifications fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, [router]);

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return;
    setMarkingAll(true);
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Mark all error:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  // Handle direct connection action from notification
  const handleConnectionAction = async (connectionId: string, status: "accepted" | "rejected", notifId: string) => {
    try {
      await supabase
        .from("connections")
        .update({ status: status })
        .eq("id", connectionId);

      // Also mark notification read
      await markAsRead(notifId);

      // Update connection locally
      setNotifications(
        notifications.map((n) => {
          if (n.connection_id === connectionId && n.connection) {
            return {
              ...n,
              is_read: true,
              connection: { ...n.connection, status },
            };
          }
          return n;
        })
      );
    } catch (err: any) {
      console.error("Action error:", err);
      alert(err.message || "Failed to update connection");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-copper animate-spin mb-2" />
        <p className="text-sm text-espresso/70">Gathering your cultural echoes...</p>
      </div>
    );
  }

  const filteredNotifs = filter === "unread"
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-parchment-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-5 h-5 text-copper-600" />
              <h1 className="font-serif text-3xl font-bold text-espresso">
                Artistic Echoes & Invocations
              </h1>
            </div>
            <p className="text-xs text-espresso/60">
              Track likes, comments, and mentorship connections in your artistic lineage.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-cream-100 border border-parchment-border rounded-xl text-xs font-semibold text-espresso transition-all shadow-subtle flex-shrink-0"
            >
              {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-copper-600" />}
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "all"
                ? "bg-copper text-white shadow-subtle"
                : "text-espresso/70 hover:bg-cream-100 bg-white/70 border border-parchment-border"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "unread"
                ? "bg-copper text-white shadow-subtle"
                : "text-espresso/70 hover:bg-cream-100 bg-white/70 border border-parchment-border"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifs.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-parchment-border text-center space-y-2">
              <Bell className="w-8 h-8 text-espresso/30 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-espresso">No notifications</h3>
              <p className="text-xs text-espresso/60">Your sanctum is quiet and peaceful.</p>
            </div>
          ) : (
            filteredNotifs.map((notif) => {
              const isUnread = !notif.is_read;

              return (
                <div
                  key={notif.id}
                  onClick={() => isUnread && markAsRead(notif.id)}
                  className={`p-5 rounded-2xl border transition-all ${
                    isUnread
                      ? "bg-white border-copper-300 shadow-card ring-1 ring-copper/10"
                      : "bg-white/80 border-parchment-border shadow-subtle hover:bg-white"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon Badge */}
                    <div className="flex-shrink-0 mt-0.5">
                      {notif.type === "like" && (
                        <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                          <Heart className="w-4 h-4 fill-red-500" />
                        </div>
                      )}
                      {notif.type === "comment" && (
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      )}
                      {notif.type === "connect_request" && (
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-antiqueGold-dark flex items-center justify-center">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                      )}
                      {notif.type === "connect_accepted" && (
                        <div className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                      {notif.type === "guru_approved" && (
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-antiqueGold-dark flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                      )}
                      {notif.type === "guru_rejected" && (
                        <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                      )}
                      {notif.type === "post_suspended" && (
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                      )}
                      {notif.type === "post_deleted" && (
                        <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                          <Trash2 className="w-4 h-4" />
                        </div>
                      )}
                      {notif.type === "post_resubmitted" && (
                        <div className="w-9 h-9 rounded-xl bg-copper-100 text-copper-800 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                      {notif.type === "post_approved" && (
                        <div className="w-9 h-9 rounded-xl bg-green-100 text-green-800 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                      {notif.type === "post_rejected" && (
                        <div className="w-9 h-9 rounded-xl bg-red-100 text-red-800 flex items-center justify-center">
                          <XCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-espresso">
                            {notif.actor?.full_name || "Sangam Council"}
                          </span>
                          <RoleBadge
                            role={notif.actor?.role}
                            isVerified={notif.actor?.is_verified}
                            guruStatus={notif.actor?.guru_status}
                            size="sm"
                          />
                        </div>
                        <span className="text-[10px] text-espresso/50 flex-shrink-0">
                          {new Date(notif.created_at).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Notification description text */}
                      <p className="text-xs text-espresso/80 leading-relaxed mb-2">
                        {notif.type === "like" && (
                          <>
                            Appreciated your creation{" "}
                            {notif.post && (
                              <Link
                                href={`/posts/${notif.post_id}`}
                                className="font-semibold italic text-copper hover:underline"
                              >
                                "{notif.post.title}"
                              </Link>
                            )}
                          </>
                        )}

                        {notif.type === "comment" && (
                          <>
                            Left an artistic reflection on{" "}
                            {notif.post && (
                              <Link
                                href={`/posts/${notif.post_id}#comments`}
                                className="font-semibold italic text-copper hover:underline"
                              >
                                "{notif.post.title}"
                              </Link>
                            )}
                          </>
                        )}

                        {notif.type === "connect_request" && (
                          <>
                            Sent you an official mentorship connection request.
                          </>
                        )}

                        {notif.type === "connect_accepted" && (
                          <>
                            Accepted your mentorship connection invitation! You can now access their private contact line.
                          </>
                        )}

                        {notif.type === "guru_approved" && (
                          <>
                            Congratulations! Your Guru mentorship status has been verified by the editorial council. The <strong>Verified Guru</strong> badge is now active.
                          </>
                        )}

                        {notif.type === "guru_rejected" && (
                          <>
                            Your Guru application was not approved by the council at this time. You can continue publishing as an artist.
                          </>
                        )}

                        {notif.type === "post_suspended" && (
                          <span>
                            {notif.message || `Your post '${notif.post_title || notif.post?.title || "your work"}' was suspended by the admin. Reason: ${notif.reason || "Under review"}. You can edit it and resubmit it.`}
                          </span>
                        )}

                        {notif.type === "post_deleted" && (
                          <span>
                            {notif.message || `Your post '${notif.post_title || "your work"}' was removed by the admin. Reason: ${notif.reason || "Policy violation"}. You are welcome to publish a new post.`}
                          </span>
                        )}

                        {notif.type === "post_resubmitted" && (
                          <span>
                            {notif.message || `${notif.actor?.full_name || "An artist"} resubmitted '${notif.post_title || notif.post?.title || "creation"}' for moderation review.`}
                          </span>
                        )}

                        {notif.type === "post_approved" && (
                          <span>
                            {notif.message || `Your post '${notif.post_title || notif.post?.title || "your work"}' has been approved by the admin and published.`}
                          </span>
                        )}

                        {notif.type === "post_rejected" && (
                          <span>
                            {notif.message || `Your resubmission for '${notif.post_title || notif.post?.title || "your work"}' was rejected by the admin. Reason: ${notif.reason || "Needs further revision"}.`}
                          </span>
                        )}
                      </p>

                      {/* If Connect Request: Show note and Accept / Reject buttons */}
                      {notif.type === "connect_request" && notif.connection && (
                        <div className="bg-cream-50 p-3.5 rounded-xl border border-parchment-border mt-2 space-y-2.5">
                          <p className="text-xs italic text-espresso/80">
                            "{notif.connection.note}"
                          </p>

                          {notif.connection.status === "pending" ? (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConnectionAction(notif.connection_id!, "rejected", notif.id);
                                }}
                                className="px-3 py-1.5 border border-parchment-border bg-white hover:bg-cream-100 text-espresso/70 rounded-lg text-xs font-medium transition-colors"
                              >
                                Decline
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConnectionAction(notif.connection_id!, "accepted", notif.id);
                                }}
                                className="px-4 py-1.5 bg-copper text-white rounded-lg text-xs font-semibold hover:bg-copper-600 shadow-subtle flex items-center gap-1 transition-all"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Accept & Reveal Contact Line</span>
                              </button>
                            </div>
                          ) : (
                            <div className="text-[11px] font-semibold">
                              {notif.connection.status === "accepted" ? (
                                <span className="text-green-700">✓ Connection Accepted</span>
                              ) : (
                                <span className="text-red-700">✕ Connection Declined</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* If Connect Accepted: Show link to profile */}
                      {notif.type === "connect_accepted" && notif.actor_id && (
                        <div className="mt-2">
                          <Link
                            href={`/profile/${notif.actor_id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-copper hover:text-copper-700"
                          >
                            <span>View Shishya Profile & Unlocked Contacts</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

