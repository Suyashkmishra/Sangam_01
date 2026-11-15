import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Check, Feather, GraduationCap, ShieldCheck, Sparkles, Info } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 text-center">
        {/* Header */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-copper-50 border border-copper-200 text-copper-800 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-copper-600" />
          <span>Sacred Ink &bull; Digital Soul</span>
        </div>

        <h1 className="font-serif text-4xl md:text-5xl font-bold text-espresso mb-4">
          Artistic Initiation Fees
        </h1>
        <p className="text-sm md:text-base text-espresso/70 max-w-xl mx-auto mb-12">
          Sangam operates on a modest cultural stewardship fee. In this college demo, all transactions are completely simulated with zero real gateway charges.
        </p>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          {/* Shishya Card */}
          <div className="bg-white rounded-2xl border-2 border-parchment-border hover:border-copper/60 transition-all p-8 flex flex-col justify-between shadow-card hover:shadow-floating">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-copper-50 text-copper-700 flex items-center justify-center">
                  <Feather className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-copper-800 bg-copper-100/60 px-3 py-1 rounded-full uppercase tracking-wider">
                  Shishya
                </span>
              </div>

              <h2 className="font-serif text-2xl font-bold text-espresso mb-1">
                Sacred Ink Initiation
              </h2>
              <p className="text-xs text-espresso/60 mb-6">
                For emerging poets, songwriters, and acoustic instrumentalists.
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="font-serif text-5xl font-bold text-espresso">₹60</span>
                <span className="text-xs text-espresso/60 font-medium">/ one-time lifetime</span>
              </div>

              <ul className="space-y-3 text-xs text-espresso/80">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-copper-600 mt-0.5 flex-shrink-0" />
                  <span>Unlimited Poetry & Acoustic Music publishing</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-copper-600 mt-0.5 flex-shrink-0" />
                  <span>Native Devanagari & Kannada script support</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-copper-600 mt-0.5 flex-shrink-0" />
                  <span>Audio upload up to 10 MB, video upload up to 50 MB</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-copper-600 mt-0.5 flex-shrink-0" />
                  <span>YouTube & Instagram rich media embeds</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-copper-600 mt-0.5 flex-shrink-0" />
                  <span>Private contact details locked until you accept a Guru</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-parchment-border">
              <Link
                href="/signup?role=shishya"
                className="w-full py-3 bg-copper text-white rounded-xl font-medium text-xs text-center block hover:bg-copper-600 transition-all shadow-subtle"
              >
                Join as Young Talent (₹60)
              </Link>
            </div>
          </div>

          {/* Guru Card */}
          <div className="bg-white rounded-2xl border-2 border-antiqueGold/60 hover:border-antiqueGold transition-all p-8 flex flex-col justify-between shadow-card hover:shadow-floating relative">
            <div className="absolute -top-3 right-6 bg-antiqueGold text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              Mentor Sanctum
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-antiqueGold-dark flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-antiqueGold-dark bg-amber-100/60 px-3 py-1 rounded-full uppercase tracking-wider">
                  Guru
                </span>
              </div>

              <h2 className="font-serif text-2xl font-bold text-espresso mb-1">
                Guru Samman & Mentorship Pass
              </h2>
              <p className="text-xs text-espresso/60 mb-6">
                For established masters, scholars, and recognized musicians.
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="font-serif text-5xl font-bold text-espresso">₹200</span>
                <span className="text-xs text-espresso/60 font-medium">/ monthly honorary</span>
              </div>

              <ul className="space-y-3 text-xs text-espresso/80">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-antiqueGold mt-0.5 flex-shrink-0" />
                  <span>Exclusive <strong>Verified Guru</strong> badge on posts and profile</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-antiqueGold mt-0.5 flex-shrink-0" />
                  <span>Send direct mentorship connection requests with custom notes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-antiqueGold mt-0.5 flex-shrink-0" />
                  <span>Unlock Shishya WhatsApp / Instagram / Email upon acceptance</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-antiqueGold mt-0.5 flex-shrink-0" />
                  <span>Publish masterclasses, critical commentaries, and guides</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-antiqueGold mt-0.5 flex-shrink-0" />
                  <span>Admin verification gate preserving artistic lineage</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-parchment-border">
              <Link
                href="/signup?role=guru"
                className="w-full py-3 bg-espresso text-cream-100 rounded-xl font-medium text-xs text-center block hover:bg-espresso-800 transition-all shadow-subtle"
              >
                Join as Guru / Mentor (₹200/mo)
              </Link>
            </div>
          </div>
        </div>

        {/* College Demo Disclaimer */}
        <div className="mt-12 max-w-xl mx-auto p-4 bg-cream-100/80 border border-parchment-border rounded-xl text-xs text-espresso/70 flex items-start gap-3 text-left">
          <Info className="w-4 h-4 text-copper-600 mt-0.5 flex-shrink-0" />
          <p>
            <strong>College Demo Notice:</strong> No real payment gateway or credit card will be charged. Clicking either plan takes you to a simulated UPI / Card checkout that records a mock transaction into the database.
          </p>
        </div>
      </main>
    </div>
  );
}

