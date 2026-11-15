"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Compass, 
  Search, 
  Filter, 
  Feather, 
  Music, 
  GraduationCap, 
  Users, 
  Loader2,
  Sparkles,
  MapPin
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Post, Profile, ContentLanguage, PostCategory } from "@/lib/types/database.types";
import { Navbar } from "@/components/layout/Navbar";
import { PostCard } from "@/components/posts/PostCard";
import { RoleBadge } from "@/components/common/Badge";

export default function ExplorePage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"works" | "gurus" | "shishyas">("works");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [gurus, setGurus] = useState<Profile[]>([]);
  const [shishyas, setShishyas] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);

        // Fetch posts with author info
        const { data: postsData } = await supabase
          .from("posts")
          .select("*, author:profiles(*), likes(count), comments(count)")
          .order("created_at", { ascending: false });

        if (postsData) {
          // If logged in, also check which posts user has liked
          let userLikes = new Set<string>();
          if (user) {
            const { data: likesData } = await supabase
              .from("likes")
              .select("post_id")
              .eq("user_id", user.id);
            if (likesData) {
              userLikes = new Set(likesData.map((l) => l.post_id));
            }
          }

          const formattedPosts: Post[] = postsData.map((p: any) => ({
            ...p,
            likes_count: p.likes?.[0]?.count || 0,
            comments_count: p.comments?.[0]?.count || 0,
            is_liked_by_user: userLikes.has(p.id),
          }));

          setPosts(formattedPosts);
        }

        // Fetch Gurus
        const { data: gurusData } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "guru")
          .order("is_verified", { ascending: false });

        if (gurusData) setGurus(gurusData as Profile[]);

        // Fetch Shishyas
        const { data: shishyasData } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "shishya")
          .order("created_at", { ascending: false });

        if (shishyasData) setShishyas(shishyasData as Profile[]);
      } catch (err) {
        console.error("Explore fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filtered Posts
  const filteredPosts = posts.filter((post) => {
    // Language filter
    if (selectedLanguage !== "All" && post.language !== selectedLanguage) return false;
    // Category filter
    if (selectedCategory !== "All" && post.category !== selectedCategory.toLowerCase()) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchBody = post.body_text?.toLowerCase().includes(q);
      const matchAuthor = post.author?.full_name?.toLowerCase().includes(q);
      return matchTitle || matchBody || matchAuthor;
    }
    return true;
  });

  // Filtered Gurus
  const filteredGurus = gurus.filter((guru) => {
    if (selectedLanguage !== "All" && !guru.languages?.includes(selectedLanguage as ContentLanguage)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return guru.full_name.toLowerCase().includes(q) || guru.bio?.toLowerCase().includes(q) || guru.city?.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered Shishyas
  const filteredShishyas = shishyas.filter((shishya) => {
    if (selectedLanguage !== "All" && !shishya.languages?.includes(selectedLanguage as ContentLanguage)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return shishya.full_name.toLowerCase().includes(q) || shishya.bio?.toLowerCase().includes(q) || shishya.city?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-parchment-border">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-copper-50 text-copper-800 text-xs font-semibold uppercase tracking-wider mb-2">
              <Compass className="w-3.5 h-3.5 text-copper-600" />
              <span>Confluence Exploration</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-espresso">
              The Living Archive
            </h1>
            <p className="text-xs text-espresso/60 mt-1">
              Explore verses, acoustics, and master mentorship across Indian linguistic lineages.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-espresso/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, artist, verses..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-parchment-border rounded-xl text-xs text-espresso placeholder-espresso/40 focus:outline-none focus:border-copper shadow-subtle"
            />
          </div>
        </div>

        {/* Tab & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Main Tabs: Works / Gurus / Shishyas */}
          <div className="flex items-center gap-2 bg-white/70 p-1.5 rounded-xl border border-parchment-border">
            <button
              onClick={() => setActiveTab("works")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "works"
                  ? "bg-copper text-white shadow-subtle"
                  : "text-espresso/70 hover:text-espresso hover:bg-cream-100"
              }`}
            >
              All Works ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab("gurus")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "gurus"
                  ? "bg-copper text-white shadow-subtle"
                  : "text-espresso/70 hover:text-espresso hover:bg-cream-100"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Gurus ({gurus.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("shishyas")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "shishyas"
                  ? "bg-copper text-white shadow-subtle"
                  : "text-espresso/70 hover:text-espresso hover:bg-cream-100"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Shishyas ({shishyas.length})</span>
            </button>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Language filter */}
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-parchment-border">
              <span className="text-[11px] text-espresso/50 font-semibold mr-1">Language:</span>
              {["All", "Hindi", "English", "Kannada"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    selectedLanguage === lang
                      ? "bg-copper-100 text-copper-900 font-bold"
                      : "text-espresso/60 hover:text-espresso"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Category filter (only applicable in Works tab) */}
            {activeTab === "works" && (
              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-parchment-border">
                <span className="text-[11px] text-espresso/50 font-semibold mr-1">Form:</span>
                {["All", "Poetry", "Music"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      selectedCategory === cat
                        ? "bg-copper-100 text-copper-900 font-bold"
                        : "text-espresso/60 hover:text-espresso"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-copper animate-spin mx-auto mb-2" />
            <p className="text-xs text-espresso/60">Sifting through the cultural archive...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: ALL WORKS GRID */}
            {activeTab === "works" && (
              <div>
                {filteredPosts.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-parchment-border text-center space-y-3">
                    <Feather className="w-8 h-8 text-espresso/30 mx-auto" />
                    <h3 className="font-serif text-lg font-bold text-espresso">No creations found</h3>
                    <p className="text-xs text-espresso/60 max-w-sm mx-auto">
                      Try adjusting your language or category filters to discover more works.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={currentUserId}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GURUS ROSTER */}
            {activeTab === "gurus" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGurus.length === 0 ? (
                  <div className="col-span-full bg-white p-12 rounded-2xl border border-parchment-border text-center space-y-2">
                    <GraduationCap className="w-8 h-8 text-espresso/30 mx-auto" />
                    <p className="text-xs text-espresso/60">No mentors match the selected criteria.</p>
                  </div>
                ) : (
                  filteredGurus.map((guru) => (
                    <div
                      key={guru.id}
                      className="bg-white p-6 rounded-2xl border border-parchment-border shadow-subtle hover:shadow-card hover:border-antiqueGold/60 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start gap-4 mb-4">
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
                          <div>
                            <h3 className="font-serif text-lg font-bold text-espresso leading-snug">
                              {guru.full_name}
                            </h3>
                            <div className="mt-1">
                              <RoleBadge
                                role="guru"
                                isVerified={guru.is_verified}
                                guruStatus={guru.guru_status}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-espresso/80 line-clamp-3 mb-4 leading-relaxed">
                          {guru.bio || "Revered artist and mentor in the Sangam lineage."}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-parchment-border/70 flex items-center justify-between text-[11px] text-espresso/60">
                        {guru.city ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-copper-600" />
                            <span>{guru.city}</span>
                          </span>
                        ) : (
                          <span>Sangam Master</span>
                        )}
                        <Link
                          href={`/profile/${guru.id}`}
                          className="font-semibold text-copper hover:text-copper-700"
                        >
                          View Profile &rarr;
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: SHISHYAS ROSTER */}
            {activeTab === "shishyas" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShishyas.length === 0 ? (
                  <div className="col-span-full bg-white p-12 rounded-2xl border border-parchment-border text-center space-y-2">
                    <Users className="w-8 h-8 text-espresso/30 mx-auto" />
                    <p className="text-xs text-espresso/60">No young artists match the selected criteria.</p>
                  </div>
                ) : (
                  filteredShishyas.map((shishya) => (
                    <div
                      key={shishya.id}
                      className="bg-white p-6 rounded-2xl border border-parchment-border shadow-subtle hover:shadow-card hover:border-copper/60 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start gap-4 mb-4">
                          {shishya.avatar_url ? (
                            <img
                              src={shishya.avatar_url}
                              alt={shishya.full_name}
                              className="w-14 h-14 rounded-2xl object-cover border border-parchment-border flex-shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-copper-100 text-copper-800 flex items-center justify-center font-serif text-xl font-bold flex-shrink-0">
                              {shishya.full_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h3 className="font-serif text-lg font-bold text-espresso leading-snug">
                              {shishya.full_name}
                            </h3>
                            <div className="mt-1">
                              <RoleBadge role="shishya" size="sm" />
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-espresso/80 line-clamp-3 mb-4 leading-relaxed">
                          {shishya.bio || "Emerging young talent exploring poetry and acoustic soul."}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-parchment-border/70 flex items-center justify-between text-[11px] text-espresso/60">
                        {shishya.city ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-copper-600" />
                            <span>{shishya.city}</span>
                          </span>
                        ) : (
                          <span>Emerging Voice</span>
                        )}
                        <Link
                          href={`/profile/${shishya.id}`}
                          className="font-semibold text-copper hover:text-copper-700"
                        >
                          View Art &rarr;
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

