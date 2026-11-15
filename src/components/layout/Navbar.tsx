"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { 
  Bell, 
  User as UserIcon, 
  LogOut, 
  PlusCircle, 
  ShieldCheck, 
  Menu, 
  X,
  Compass,
  Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types/database.types";
import { RoleBadge } from "@/components/common/Badge";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Fetch profile
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (prof) {
            setProfile(prof as Profile);
          } else {
            // Profile fallback from metadata if DB row is not synced
            setProfile({
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
            });
          }

          // Fetch unread notifications count
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

          setUnreadCount(count || 0);
        }
      } catch (err) {
        console.error("Navbar auth load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          setProfile(null);
          setUnreadCount(0);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setDropdownOpen(false);
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { label: "Explore", href: "/explore", icon: Compass },
    { label: "Pricing", href: "/pricing", icon: Sparkles },
    ...(user ? [{ label: "Dashboard", href: "/dashboard", icon: null }] : []),
  ];

  return (
    <nav className="border-b border-parchment-border bg-cream-50/90 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-44 h-11 transition-transform group-hover:scale-[1.02]">
            <Image 
              src="/logo.svg" 
              alt="Sangam Logo" 
              fill 
              className="object-contain" 
              priority 
            />
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors py-1 ${
                pathname === link.href
                  ? "text-copper font-semibold border-b-2 border-copper"
                  : "text-espresso/80 hover:text-copper"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Section: User Controls or Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-parchment-border/40 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-4">
              {/* Create Post Button */}
              <Link
                href="/posts/create"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-copper-50 text-copper-800 border border-copper-300 rounded-lg hover:bg-copper-100 transition-all shadow-subtle"
              >
                <PlusCircle className="w-3.5 h-3.5 text-copper-600" />
                <span>Create Post</span>
              </Link>

              {/* Notification Bell */}
              <Link
                href="/notifications"
                className="relative p-2 rounded-full text-espresso/70 hover:text-copper hover:bg-cream-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 bg-copper text-white text-[10px] font-bold rounded-full animate-bounce">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile Menu Trigger */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full border border-parchment-border hover:border-copper/40 transition-all focus:outline-none"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-copper-100 text-copper-800 flex items-center justify-center text-xs font-bold">
                      {profile?.full_name?.charAt(0).toUpperCase() || "S"}
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-parchment-border shadow-floating py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2.5 border-b border-parchment-border/60">
                        <p className="text-sm font-semibold text-espresso truncate">
                          {profile?.full_name || "Artist"}
                        </p>
                        <p className="text-xs text-espresso/60 truncate mb-1.5">
                          {user.email}
                        </p>
                        <RoleBadge
                          role={profile?.role}
                          isVerified={profile?.is_verified}
                          guruStatus={profile?.guru_status}
                          size="sm"
                        />
                      </div>

                      <div className="py-1 text-xs text-espresso/80 font-medium">
                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-cream-100 hover:text-copper transition-colors"
                        >
                          <Compass className="w-4 h-4 text-copper-600" />
                          Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-cream-100 hover:text-copper transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-copper-600" />
                          My Profile & Contacts
                        </Link>
                        <Link
                          href="/posts/create"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-cream-100 hover:text-copper transition-colors"
                        >
                          <PlusCircle className="w-4 h-4 text-copper-600" />
                          Publish Poetry / Music
                        </Link>

                        {/* Admin Link if role is admin */}
                        {profile?.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 bg-espresso/5 text-espresso font-semibold hover:bg-espresso/10 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-antiqueGold" />
                            Admin Guru Approvals
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-parchment-border/60 pt-1 mt-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-700 hover:bg-red-50 transition-colors font-medium text-left"
                        >
                          <LogOut className="w-4 h-4 text-red-600" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-semibold text-espresso hover:text-copper border border-espresso/20 hover:border-copper rounded-lg transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-xs font-semibold bg-copper text-white rounded-lg hover:bg-copper-600 shadow-subtle transition-all"
              >
                Join Sangam
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="md:hidden flex items-center gap-2">
          {user && (
            <Link
              href="/notifications"
              className="relative p-2 text-espresso/80 hover:text-copper"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-copper rounded-full" />
              )}
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-espresso hover:bg-cream-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-parchment-border mt-3 pt-3 pb-4 space-y-2">
          {user && profile && (
            <div className="px-3 py-2 bg-cream-100 rounded-lg mb-2">
              <p className="text-xs font-bold text-espresso">{profile.full_name}</p>
              <p className="text-[11px] text-espresso/60 mb-1">{user.email}</p>
              <RoleBadge
                role={profile.role}
                isVerified={profile.is_verified}
                guruStatus={profile.guru_status}
                size="sm"
              />
            </div>
          )}

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-espresso/80 hover:text-copper hover:bg-cream-100 rounded-lg"
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <>
              <Link
                href="/posts/create"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-copper hover:bg-copper-50 rounded-lg"
              >
                + Create Post
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-espresso/80 hover:text-copper hover:bg-cream-100 rounded-lg"
              >
                Profile & Contacts
              </Link>
              {profile?.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-antiqueGold-dark hover:bg-cream-100 rounded-lg"
                >
                  Admin Verification Panel
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 text-xs font-semibold border border-espresso/20 rounded-lg text-espresso"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 text-xs font-semibold bg-copper text-white rounded-lg shadow-subtle"
              >
                Join Sangam
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

