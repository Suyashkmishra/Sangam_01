import React from "react";

export function HeroBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden -z-10"
      aria-hidden="true"
    >
      {/* Layer A: Drifting Glow Circles */}
      {/* Circle 1: Warm copper-peach (#E2A46B), ~200px, blur 38px, opacity ~0.45 */}
      <div
        className="absolute top-[8%] left-[10%] sm:left-[18%] w-[200px] h-[200px] rounded-full blur-[38px] animate-drift-copper"
        style={{
          backgroundColor: "#E2A46B",
          opacity: 0.45,
        }}
      />

      {/* Circle 2: Light gold (#F0CF8A), ~200px, blur 38px, opacity ~0.45 */}
      <div
        className="absolute top-[35%] right-[10%] sm:right-[16%] w-[200px] h-[200px] rounded-full blur-[38px] animate-drift-gold"
        style={{
          backgroundColor: "#F0CF8A",
          opacity: 0.45,
        }}
      />

      {/* Layer C: Waving Curved SVG Lines */}
      {/* Line 1: Copper (#B8622E, opacity 0.35, stroke 1.4, 9s alternate sway) */}
      <div className="absolute top-[22%] left-0 right-0 w-full h-36 overflow-hidden animate-sway-1">
        <svg
          viewBox="0 0 1440 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full preserve-3d"
          preserveAspectRatio="none"
        >
          <path
            d="M-20,70 C280,135 620,15 980,105 C1200,150 1360,45 1460,75"
            stroke="#B8622E"
            strokeWidth="1.4"
            strokeOpacity="0.35"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Line 2: Antique gold (#A8751F, opacity 0.4, stroke 1.2, 12s alternate sway) */}
      <div className="absolute top-[48%] left-0 right-0 w-full h-36 overflow-hidden animate-sway-2">
        <svg
          viewBox="0 0 1440 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full preserve-3d"
          preserveAspectRatio="none"
        >
          <path
            d="M-20,95 C320,25 680,140 1020,40 C1220,-10 1380,85 1460,65"
            stroke="#A8751F"
            strokeWidth="1.2"
            strokeOpacity="0.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}
