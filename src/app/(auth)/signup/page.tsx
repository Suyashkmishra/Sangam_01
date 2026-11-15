"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  UserPlus, 
  Sparkles, 
  GraduationCap, 
  Feather, 
  Mail, 
  Lock, 
  User, 
  MapPin, 
  Check, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [role, setRole] = useState<"shishya" | "guru">("shishya");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [languages, setLanguages] = useState<string[]>(["Hindi"]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "guru") {
      setRole("guru");
    } else if (roleParam === "shishya") {
      setRole("shishya");
    }
  }, [searchParams]);

  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      if (languages.length > 1) {
        setLanguages(languages.filter((l) => l !== lang));
      }
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      // Strictly pass only 'shishya' or 'guru'
      const sanitizedRole = role === "guru" ? "guru" : "shishya";

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            role: sanitizedRole,
            full_name: fullName.trim(),
            city: city.trim(),
            languages: languages,
          },
        },
      });

      if (error) {
        throw error;
      }

      router.push(`/checkout?role=${sanitizedRole}`);
      router.refresh();
    } catch (err: any) {
      console.error("Signup error:", err);
      setErrorMsg(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-floating border border-parchment-border rounded-2xl sm:px-10">
      <form className="space-y-6" onSubmit={handleSignup}>
        {/* Role Selection Cards */}
        <div>
          <label className="block text-xs font-semibold text-espresso/80 mb-2">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Shishya Option */}
            <button
              type="button"
              onClick={() => setRole("shishya")}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                role === "shishya"
                  ? "border-copper bg-copper-50/70 shadow-subtle ring-1 ring-copper"
                  : "border-parchment-border hover:border-copper/40 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Feather className={`w-5 h-5 ${role === "shishya" ? "text-copper-700" : "text-espresso/40"}`} />
                {role === "shishya" && (
                  <span className="w-4 h-4 rounded-full bg-copper text-white flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                )}
              </div>
              <div className="font-serif font-bold text-base text-espresso">Shishya</div>
              <div className="text-[11px] text-espresso/70 mt-0.5">Young Talent & Poet</div>
              <div className="mt-2 text-[10px] font-bold text-copper-700 bg-copper-100/50 px-2 py-0.5 rounded inline-block">
                ₹60 one-time fee
              </div>
            </button>

            {/* Guru Option */}
            <button
              type="button"
              onClick={() => setRole("guru")}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                role === "guru"
                  ? "border-antiqueGold bg-amber-50/70 shadow-subtle ring-1 ring-antiqueGold"
                  : "border-parchment-border hover:border-antiqueGold/40 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <GraduationCap className={`w-5 h-5 ${role === "guru" ? "text-antiqueGold-dark" : "text-espresso/40"}`} />
                {role === "guru" && (
                  <span className="w-4 h-4 rounded-full bg-antiqueGold text-white flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                )}
              </div>
              <div className="font-serif font-bold text-base text-espresso">Guru</div>
              <div className="text-[11px] text-espresso/70 mt-0.5">Established Artist / Mentor</div>
              <div className="mt-2 text-[10px] font-bold text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded inline-block">
                ₹200 / month
              </div>
            </button>
          </div>

          {role === "guru" && (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 mt-2">
              ✦ Note: Guru accounts undergo admin verification before mentorship connects unlock.
            </p>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-espresso/80">
            Full Name (Artist Pseudonym)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-espresso/40">
              <User className="h-4 w-4" />
            </div>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={role === "guru" ? "e.g. Pandit Raghunath Roy" : "e.g. Aarav Neelkanth"}
              className="block w-full pl-10 pr-3 py-2.5 text-sm bg-cream-50/50 border border-parchment-border rounded-xl text-espresso focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold text-espresso/80">
            Email Address
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-espresso/40">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="artist@example.com"
              className="block w-full pl-10 pr-3 py-2.5 text-sm bg-cream-50/50 border border-parchment-border rounded-xl text-espresso focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-espresso/80">
            Password (min 6 characters)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-espresso/40">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full pl-10 pr-3 py-2.5 text-sm bg-cream-50/50 border border-parchment-border rounded-xl text-espresso focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
            />
          </div>
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-semibold text-espresso/80">
            City / Cultural Origin
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-espresso/40">
              <MapPin className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Varanasi, Bengaluru, Lucknow, Kolkata"
              className="block w-full pl-10 pr-3 py-2.5 text-sm bg-cream-50/50 border border-parchment-border rounded-xl text-espresso focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
            />
          </div>
        </div>

        {/* Language Preferences */}
        <div>
          <label className="block text-xs font-semibold text-espresso/80 mb-1.5">
            Artistic Languages (Choose at least one)
          </label>
          <div className="flex gap-2">
            {["Hindi", "English", "Kannada"].map((lang) => {
              const selected = languages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    selected
                      ? "border-copper bg-copper-100 text-copper-900 font-semibold"
                      : "border-parchment-border bg-white text-espresso/70 hover:bg-cream-100"
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5 text-copper-700" />}
                  <span>{lang}</span>
                </button>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-subtle text-sm font-semibold text-white bg-copper hover:bg-copper-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-copper disabled:opacity-70 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Initiating Sangam Account...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Continue to Mock Payment ({role === "guru" ? "₹200/mo" : "₹60 one-time"})</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-xs text-espresso/70">
        <span>Already have an initiated soul? </span>
        <Link
          href="/login"
          className="font-semibold text-copper hover:text-copper-700 underline underline-offset-2"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block mb-3">
          <div className="flex justify-center">
            <Image 
              src="/logo.png" 
              alt="Sangam logo" 
              width={751} 
              height={572} 
              className="h-12 w-auto object-contain" 
              priority 
            />
          </div>
        </Link>
        <h2 className="font-serif text-3xl font-bold tracking-tight text-espresso">
          Join the Sangam Confluence
        </h2>
        <p className="mt-1.5 text-xs text-espresso/70">
          Sacred Ink meets Digital Soul. Choose your artistic initiation path.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <Suspense fallback={
          <div className="bg-white p-12 rounded-2xl border border-parchment-border text-center">
            <Loader2 className="w-6 h-6 animate-spin text-copper mx-auto mb-2" />
            <p className="text-xs text-espresso/60">Loading registration sanctuary...</p>
          </div>
        }>
          <SignupContent />
        </Suspense>
      </div>
    </div>
  );
}
