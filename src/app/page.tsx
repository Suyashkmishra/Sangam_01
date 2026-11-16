import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Feather, GraduationCap, Sparkles, BookOpen, Users, ArrowRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { HeroBackground } from "@/components/home/HeroBackground";
import { RunningPoetryStrip, PoetryCardItem } from "@/components/home/RunningPoetryStrip";

export const dynamic = "force-dynamic";

// High quality fallback poetry items using only imaginary seeded works from Sangam artists
const FALLBACK_POEMS: PoetryCardItem[] = [
  {
    id: "d0000000-0000-0000-0000-000000000001",
    title: "धूप के साये और सूखी नदी",
    language: "Hindi",
    previewLines: [
      "कंक्रीट की छांव में बैठा, ढूँढता हूँ अपनी पहचान,",
      "कागज़ की कश्ती थी कभी, अब बहता है केवल गुमान।",
      "नदी सूख चुकी है शहर की, पर प्यास अब भी वही पुरानी है...",
    ],
    authorName: "Aarav Neelkanth",
  },
  {
    id: "d0000000-0000-0000-0000-000000000002",
    title: "ಬೆಳದಿಂಗಳ ಮೌನದಲ್ಲಿ (In the Moonlight)",
    language: "Kannada",
    previewLines: [
      "ರಾತ್ರಿಯ ಮೌನದಲ್ಲಿ ತೇಲಿ ಬರುವ ನಾದ,",
      "ಹೃದಯದ ಕದ ತೆರೆದು ಕೇಳುವೆ ನಿನ್ನ ವಾದ।",
      "ಚಂದ್ರನ ಬೆಳಕಲಿ ಮಿಂದ ಹಳ್ಳಿ ಹಾದಿ...",
    ],
    authorName: "Chetan Kumar",
  },
  {
    id: "d0000000-0000-0000-0000-000000000005",
    title: "The Copper Loom of Dawn",
    language: "English",
    previewLines: [
      "We speak in borrowed rhythms till the night,",
      "Unspools the quiet ache of who we were,",
      "A solitary chime upon the sill...",
    ],
    authorName: "Tanya Mukherjee",
  },
  {
    id: "d0000000-0000-0000-0000-000000000003",
    title: "मिट्टी की सौंधी खुशबू",
    language: "Hindi",
    previewLines: [
      "पहली बूँद जब गिरी धरा पर, तृप्त हुआ हर प्राण,",
      "हवा में घुलकर फैल गया इक सदियों पुराना गान।",
      "न खेत बचे न वो पीपल छांव, कंक्रीट का यह जंगल...",
    ],
    authorName: "Ananya Sharma",
  },
  {
    id: "d0000000-0000-0000-0000-000000000007",
    title: "ಹೃದಯದ ನಾದ ತರಂಗ (Whispers of the Soul)",
    language: "Kannada",
    previewLines: [
      "ತಂತಿಯ ಮೇಲೆ ಬೆರಳುಗಳು ನುಡಿಸುವಾಗ ಹಳೆಯ ರಾಗ,",
      "ಕಣ್ಮುಂದೆ ನಿಲ್ಲುವುದು ಗುರು ತೋರಿದ ದಿವ್ಯ ಭಾಗ।",
      "ಸಾಹಿತ್ಯದ ಹನಿಯಲ್ಲಿ ಮಿಂದ ಮನಸು...",
    ],
    authorName: "Lavanya Rao",
  },
  {
    id: "d0000000-0000-0000-0000-000000000009",
    title: "Sonnet of the Backwaters",
    language: "English",
    previewLines: [
      "The slow green water carries what we leave,",
      "Old hymns recited to the darkening tide,",
      "Where heron wait and salt-winds gently breathe...",
    ],
    authorName: "Meera Chandran",
  },
];

async function getPoetryPosts(): Promise<PoetryCardItem[]> {
  try {
    const adminClient = createAdminClient();
    const { data: posts, error } = await adminClient
      .from("posts")
      .select("id, title, category, language, body_text, author:profiles!posts_author_id_fkey(full_name, role, is_suspended, guru_status)")
      .eq("category", "poetry")
      .order("created_at", { ascending: false });

    if (error || !posts || posts.length === 0) {
      return FALLBACK_POEMS;
    }

    const filtered = posts
      .filter((p: any) => {
        const author = p.author;
        if (!author || author.is_suspended) return false;
        if (author.role === "guru" && author.guru_status !== "approved") return false;
        return true;
      })
      .map((p: any) => {
        const lines = (p.body_text || "")
          .split("\n")
          .map((l: string) => l.trim())
          .filter(Boolean)
          .slice(0, 3);

        return {
          id: p.id,
          title: p.title,
          language: p.language,
          previewLines: lines.length > 0 ? lines : [p.title],
          authorName: p.author?.full_name || "Unknown Artist",
        };
      });

    return filtered.length > 0 ? filtered : FALLBACK_POEMS;
  } catch (err) {
    return FALLBACK_POEMS;
  }
}

export default async function Home() {
  const poetryPosts = await getPoetryPosts();

  return (
    <div className="min-h-screen flex flex-col bg-cream text-espresso">
      {/* Dynamic Navbar */}
      <Navbar />

      {/* Hero Section Container with subtle background animations */}
      <section className="relative overflow-hidden w-full flex flex-col items-center justify-center px-6 pt-16 pb-20 text-center">
        {/* Subtle Background Animation: Layer A (drifting glow) & Layer C (waving lines) */}
        <HeroBackground />

        {/* Hero Content (Layered cleanly above animations with full readability) */}
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
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

          {/* Thin decorative divider */}
          <div className="mt-16 text-copper/40 flex items-center justify-center gap-4">
            <div className="h-[1px] w-20 bg-copper/30" />
            <span className="text-xs font-serif italic text-antiqueGold">
              संगम &bull; Guru-Shishya Parampara
            </span>
            <div className="h-[1px] w-20 bg-copper/30" />
          </div>
        </div>
      </section>

      {/* Running Poetry Strip below Hero */}
      <RunningPoetryStrip poems={poetryPosts} />

      {/* Feature Highlights Grid */}
      <main className="max-w-5xl mx-auto px-6 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
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
