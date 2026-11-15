"use client";

import React, { useEffect, useState } from "react";
import { Lock, Unlock, Mail, Phone, Instagram, ShieldCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ProfileContact } from "@/lib/types/database.types";

interface ContactDetailsViewProps {
  shishyaId: string;
  isOwner?: boolean;
  isConnectedGuru?: boolean;
}

export function ContactDetailsView({
  shishyaId,
  isOwner = false,
  isConnectedGuru = false,
}: ContactDetailsViewProps) {
  const supabase = createClient();
  const [contacts, setContacts] = useState<ProfileContact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContacts() {
      try {
        // Query profile_contacts directly - protected by PostgreSQL RLS
        const { data, error } = await supabase
          .from("profile_contacts")
          .select("*")
          .eq("user_id", shishyaId)
          .maybeSingle();

        if (data) {
          setContacts(data as ProfileContact);
        }
      } catch (err) {
        console.error("Contact fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, [shishyaId]);

  if (loading) {
    return (
      <div className="p-4 bg-cream-50 rounded-2xl border border-parchment-border flex items-center justify-center gap-2 text-xs text-espresso/60">
        <Loader2 className="w-4 h-4 animate-spin text-copper" />
        <span>Verifying cryptographic lineage permission...</span>
      </div>
    );
  }

  // If contacts are accessible (either owner, or accepted connected guru via RLS)
  if (contacts && (contacts.contact_whatsapp || contacts.contact_instagram || contacts.contact_email)) {
    return (
      <div className="bg-gradient-to-br from-green-50/80 to-cream-50 rounded-2xl border border-green-200/80 p-5 shadow-subtle space-y-3">
        <div className="flex items-center gap-2 text-green-800 text-xs font-bold">
          <Unlock className="w-4 h-4 text-green-600" />
          <span>Unlocked Mentorship Contact Line</span>
          {isConnectedGuru && (
            <span className="text-[10px] bg-green-200/60 text-green-900 px-2 py-0.5 rounded-full font-medium ml-auto">
              Connection Accepted
            </span>
          )}
        </div>

        <p className="text-[11px] text-espresso/70">
          Direct communication channels authorized for classical and acoustic mentorship.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          {contacts.contact_whatsapp && (
            <a
              href={`https://wa.me/${contacts.contact_whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white rounded-xl border border-green-200 hover:border-green-400 transition-all flex items-center gap-2.5 text-espresso shadow-subtle group"
            >
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-espresso/50 font-semibold uppercase">WhatsApp</div>
                <div className="font-semibold text-green-800 truncate">{contacts.contact_whatsapp}</div>
              </div>
            </a>
          )}

          {contacts.contact_instagram && (
            <a
              href={`https://instagram.com/${contacts.contact_instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white rounded-xl border border-pink-200 hover:border-pink-400 transition-all flex items-center gap-2.5 text-espresso shadow-subtle group"
            >
              <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Instagram className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-espresso/50 font-semibold uppercase">Instagram</div>
                <div className="font-semibold text-pink-800 truncate">{contacts.contact_instagram}</div>
              </div>
            </a>
          )}

          {contacts.contact_email && (
            <a
              href={`mailto:${contacts.contact_email}`}
              className="p-3 bg-white rounded-xl border border-amber-200 hover:border-amber-400 transition-all flex items-center gap-2.5 text-espresso shadow-subtle group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-espresso/50 font-semibold uppercase">Email</div>
                <div className="font-semibold text-amber-900 truncate">{contacts.contact_email}</div>
              </div>
            </a>
          )}
        </div>
      </div>
    );
  }

  // Locked State
  return (
    <div className="bg-cream-100/70 rounded-2xl border border-dashed border-parchment-border p-5 text-center space-y-2">
      <div className="w-10 h-10 rounded-full bg-espresso/5 text-espresso/40 flex items-center justify-center mx-auto">
        <Lock className="w-5 h-5" />
      </div>
      <h4 className="font-serif text-base font-bold text-espresso">
        Contact Line Locked by Lineage Policy
      </h4>
      <p className="text-xs text-espresso/60 max-w-md mx-auto">
        To protect young artists from unsolicited contact, WhatsApp, Instagram, and email details remain encrypted until a mentorship connection request is explicitly accepted by this Shishya.
      </p>
    </div>
  );
}
