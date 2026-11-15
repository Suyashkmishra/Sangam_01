import React from "react";
import Link from "next/link";
import { Clock, ShieldAlert } from "lucide-react";

export function PendingGuruBanner() {
  return (
    <div className="bg-gradient-to-r from-copper-50 via-cream-100 to-copper-50 border-b border-copper-200/80 px-6 py-3 text-espresso">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-copper-100 flex items-center justify-center text-copper-700 flex-shrink-0">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-semibold text-copper-800">Guru Verification Pending: </span>
            <span className="text-espresso/80">
              Your mentorship credentials are being reviewed by our curatorial council. Exploration is open, but connection and mentorship requests will unlock upon approval.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 text-xs">
          <span className="inline-flex items-center gap-1 text-copper-700 bg-white/70 px-2.5 py-1 rounded-full border border-copper-200">
            <ShieldAlert className="w-3.5 h-3.5 text-copper-600" />
            Status: Under Review
          </span>
          <Link
            href="/pricing"
            className="text-copper-700 hover:text-copper-900 underline underline-offset-2 ml-1"
          >
            Review Terms
          </Link>
        </div>
      </div>
    </div>
  );
}

