import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Feather, GraduationCap, Sparkles, BookOpen, Music, Users, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-espresso">
      {/* Dynamic Navbar */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-5xl mx-auto">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-copper-50 border border-copper-200 text-copper-800 text-xs tracking-widest font-semibold uppercase mb-8 shadow-subtle">
          <Sparkles className="w-3.5 h-3.5 text-copper-600" />
          <span>THE CONFLUENCE OF TWO GENERATIONS</span>
          <Sparkles className="w-3.5 h-3.5 text-copper-600" />
        </div>

        {/* Headline */}
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.12] text-espresso mb-6">
          Where Young Voices Find Their <span className="hero-accent font-serif">Guru</span>
        </h1>

        {/* Subtext */}
        <p className="text-base sm:text-lg md:text-xl text-espresso/80 max-w-2xl font-light mb-10 leading-relaxed">
          A sanctum connecting unrecognised poets and acoustic artists with revered masters across Hindi, Kannada, and English.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/signup?role=shishya"
            className="w-full sm:w-auto px-8 py-4 bg-copper text-white font-medium text-sm rounded-xl hover:bg-copper-600 transition-all shadow-card hover:shadow-floating flex items-center justify-center gap-2"
          >
            <Feather className="w-4 h-4" />
            <span>Join as Young Talent (Shishya)</span>
          </Link>
          <Link
            href="/signup?role=guru"
            className="w-full sm:w-auto px-8 py-4 border-2 border-espresso text-espresso font-medium text-sm rounded-xl hover:bg-espresso hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Join as Guru / Mentor</span>
          </Link>
        </div>

        {/* Thin curved decorative lines */}
        <div className="mt-16 text-copper/40 flex items-center justify-center gap-4">
          <div className="h-[1px] w-20 bg-copper/30"></div>
          <span className="text-xs font-serif italic text-antiqueGold">संगम &bull; Guru-Shishya Parampara</span>
          <div className="h-[1px] w-20 bg-copper/30"></div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-parchment-border shadow-subtle">
            <div className="w-10 h-10 rounded-xl bg-copper-50 text-copper-700 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-espresso mb-1">
              Devanagari & Kannada Scripts
            </h3>
            <p className="text-xs text-espresso/70 leading-relaxed">
              Native linguistic typography designed for Hindi ghazals, kavita, dohas, and Kannada vachanas and bhavageethe.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-parchment-border shadow-subtle">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-antiqueGold-dark flex items-center justify-center mb-4">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-espresso mb-1">
              Verified Guru Guardians
            </h3>
            <p className="text-xs text-espresso/70 leading-relaxed">
              Gurus undergo curatorial council review. Once verified, masters provide direct feedback and mentorship notes.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-parchment-border shadow-subtle">
            <div className="w-10 h-10 rounded-xl bg-copper-50 text-copper-700 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-espresso mb-1">
              Private Contact Unlocking
            </h3>
            <p className="text-xs text-espresso/70 leading-relaxed">
              Shishya contact details (WhatsApp, Instagram, email) remain encrypted and hidden until a mentorship request is explicitly accepted.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-parchment-border py-8 text-center text-xs text-espresso/60 bg-cream-100">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="Sangam logo" 
                width={751}
                height={572}
                className="h-10 w-auto object-contain" 
              />
            </Link>
            <span>&bull;</span>
            <span>Sacred Ink meets Digital Soul</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-espresso/70">
            <Link href="/explore" className="hover:text-copper transition-colors">Explore</Link>
            <Link href="/pricing" className="hover:text-copper transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-copper transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
