"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export interface PoetryCardItem {
  id: string;
  title: string;
  language: "Hindi" | "Kannada" | "English" | string;
  previewLines: string[];
  authorName: string;
}

interface RunningPoetryStripProps {
  poems: PoetryCardItem[];
}

export function RunningPoetryStrip({ poems }: RunningPoetryStripProps) {
  if (!poems || poems.length === 0) return null;

  // If fewer than 6 poems, repeat them until we have at least 6
  let pool = [...poems];
  while (pool.length < 6) {
    pool = [...pool, ...poems];
  }

  // Duplicate for seamless 0% -> -50% continuous CSS scroll
  const loopedPoems = [...pool, ...pool];

  return (
    <section className="w-full py-12 relative overflow-hidden bg-cream">
      {/* Subtle section label */}
      <div className="max-w-6xl mx-auto px-4 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-copper-600 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider uppercase text-copper-800">
            Voices in Flow &bull; Living Verses
          </span>
        </div>
        <Link
          href="/explore"
          className="text-xs font-medium text-copper hover:text-copper-700 flex items-center gap-1 transition-colors"
        >
          <span>Explore All Creations</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Infinite scrolling viewport with soft gradient edge masks */}
      <div className="relative w-full overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-12 sm:before:w-28 before:bg-gradient-to-r before:from-cream before:to-transparent before:z-10 before:pointer-events-none after:absolute after:right-0 after:top-0 after:bottom-0 after:w-12 sm:after:w-28 after:bg-gradient-to-l after:from-cream after:to-transparent after:z-10 after:pointer-events-none">
        <div className="animate-poetry-scroll flex gap-5 py-2 px-4 hover:[animation-play-state:paused]">
          {loopedPoems.map((poem, index) => {
            const isHindi = poem.language === "Hindi";
            const isKannada = poem.language === "Kannada";

            const scriptClass = isHindi
              ? "font-devanagari text-xs text-espresso/80 leading-relaxed"
              : isKannada
              ? "font-kannada text-xs text-espresso/80 leading-relaxed"
              : "font-serif text-sm italic text-espresso/80 leading-relaxed";

            const tagColor = isHindi
              ? "bg-copper-50 text-copper-800 border-copper-200/70"
              : isKannada
              ? "bg-amber-50 text-antiqueGold-dark border-amber-200/70"
              : "bg-cream-100 text-espresso/70 border-parchment-border";

            return (
              <Link
                key={`${poem.id}-${index}`}
                href={`/posts/${poem.id}`}
                className="w-[280px] sm:w-[320px] shrink-0 bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-parchment-border shadow-subtle hover:shadow-card hover:border-copper/60 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Language & Title */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tagColor}`}
                    >
                      {poem.language}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-copper-500/40 group-hover:text-copper-600 transition-colors" />
                  </div>

                  <h3 className="font-serif text-base font-bold text-espresso group-hover:text-copper transition-colors truncate mb-3">
                    {poem.title}
                  </h3>

                  {/* 2 to 3 verse lines with native script typography */}
                  <div className={`${scriptClass} space-y-1 mb-4 line-clamp-3`}>
                    {poem.previewLines.map((line, lineIdx) => (
                      <p key={lineIdx} className="truncate">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Footer: Author pseudonym & prompt */}
                <div className="pt-3 border-t border-parchment-border/60 flex items-center justify-between text-xs">
                  <span className="font-medium text-espresso/70 truncate max-w-[170px]">
                    &mdash; {poem.authorName}
                  </span>
                  <span className="text-[11px] font-semibold text-copper-700 group-hover:text-copper-800 transition-colors">
                    Read &rarr;
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
