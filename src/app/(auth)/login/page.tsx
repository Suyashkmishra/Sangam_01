"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  LogIn, 
  Lock, 
  Mail, 
  Loader2, 
  Sparkles, 
  AlertCircle 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Hide 1-click demo buttons unless ?demo=1 is in the URL
  const isDemoMode = searchParams.get("demo") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        throw error;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(
        err.message === "Invalid login credentials"
          ? "Invalid email or password. Please verify your credentials or run the reset-demo script."
          : err.message || "Failed to sign in"
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-Click Demo Login
  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg("");
  };

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      {/* 1-Click Demo Accounts Banner: ONLY visible when ?demo=1 is in URL */}
      {isDemoMode && (
        <div className="mb-6 bg-parchment border border-copper-200/80 rounded-2xl p-4 shadow-subtle animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-copper-800 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-copper-600" />
              <span>Live Presentation Demo Accounts (1-Click Fill)</span>
            </div>
            <span className="text-[10px] bg-copper-100 text-copper-800 font-mono px-1.5 py-0.5 rounded">
              ?demo=1
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillDemo("admin.demo@sangam.test", "Demo@1234")}
              className="p-2 rounded-lg bg-white/80 hover:bg-white border border-parchment-border hover:border-copper text-left transition-all"
            >
              <div className="font-bold text-espresso">Admin (Peethadhish)</div>
              <div className="text-[10px] text-espresso/60 truncate">admin.demo@sangam.test</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemo("guru.demo@sangam.test", "Demo@1234")}
              className="p-2 rounded-lg bg-white/80 hover:bg-white border border-parchment-border hover:border-copper text-left transition-all"
            >
              <div className="font-bold text-copper-800">Verified Guru</div>
              <div className="text-[10px] text-espresso/60 truncate">guru.demo@sangam.test</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemo("shishya.demo@sangam.test", "Demo@1234")}
              className="p-2 rounded-lg bg-white/80 hover:bg-white border border-parchment-border hover:border-copper text-left transition-all"
            >
              <div className="font-bold text-espresso">Young Shishya</div>
              <div className="text-[10px] text-espresso/60 truncate">shishya.demo@sangam.test</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemo("pending.guru@sangam.test", "Demo@1234")}
              className="p-2 rounded-lg bg-white/80 hover:bg-white border border-parchment-border hover:border-copper text-left transition-all"
            >
              <div className="font-bold text-amber-800">Pending Guru</div>
              <div className="text-[10px] text-espresso/60 truncate">pending.guru@sangam.test</div>
            </button>
          </div>
        </div>
      )}

      {/* Login Card */}
      <div className="bg-white py-8 px-6 shadow-floating border border-parchment-border rounded-2xl sm:px-10">
        <form className="space-y-5" onSubmit={handleLogin}>
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
                placeholder="artist@sangam.test"
                className="block w-full pl-10 pr-3 py-2.5 text-sm bg-cream-50/50 border border-parchment-border rounded-xl text-espresso focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-espresso/80">
              Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-espresso/40">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-2.5 text-sm bg-cream-50/50 border border-parchment-border rounded-xl text-espresso focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
              />
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
                  <span>Entering Sangam...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-espresso/70">
          <span>New voice seeking mentorship? </span>
          <Link
            href="/signup"
            className="font-semibold text-copper hover:text-copper-700 underline underline-offset-2"
          >
            Join as Shishya or Guru
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block mb-4">
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
          Enter the Sanctum
        </h2>
        <p className="mt-2 text-xs text-espresso/70">
          Where sacred ink meets digital soul. Sign in to your artist portal.
        </p>
      </div>

      <Suspense fallback={
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md bg-white p-8 rounded-2xl border border-parchment-border text-center">
          <Loader2 className="w-6 h-6 animate-spin text-copper mx-auto mb-2" />
          <p className="text-xs text-espresso/60">Opening artist portal...</p>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}
