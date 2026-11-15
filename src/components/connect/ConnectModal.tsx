"use client";

import React, { useState } from "react";
import { 
  Send, 
  Sparkles, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  GraduationCap
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ConnectModalProps {
  shishyaId: string;
  shishyaName: string;
  postId?: string | null;
  postTitle?: string | null;
  currentGuruId: string;
  isVerifiedGuru: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ConnectModal({
  shishyaId,
  shishyaName,
  postId,
  postTitle,
  currentGuruId,
  isVerifiedGuru,
  isOpen,
  onClose,
  onSuccess,
}: ConnectModalProps) {
  const supabase = createClient();

  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    if (!isVerifiedGuru) {
      setErrorMsg("Your Guru status is pending admin verification. Connection requests will unlock upon approval.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.from("connections").insert({
        guru_id: currentGuruId,
        shishya_id: shishyaId,
        post_id: postId || null,
        note: note.trim(),
        status: "pending",
      });

      if (error) throw error;

      setStatus("success");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Connection request error:", err);
      setErrorMsg(err.message || "Failed to initiate mentorship connection");
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-cream-50 border border-parchment-border rounded-2xl max-w-lg w-full shadow-floating overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-parchment-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-espresso">
            <div className="w-8 h-8 rounded-lg bg-antiqueGold/15 text-antiqueGold-dark flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">Initiate Mentorship Bond</h3>
              <p className="text-[11px] text-espresso/60">Connect with {shishyaName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-espresso/40 hover:text-espresso p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {status === "success" ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h4 className="font-serif text-xl font-bold text-espresso">
                Mentorship Invitation Sent!
              </h4>
              <p className="text-xs text-espresso/70 max-w-xs mx-auto">
                {shishyaName} has been notified. Once they accept your invitation, their chosen contact details (WhatsApp/Instagram) will unlock.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {postTitle && (
                <div className="bg-white p-3 rounded-xl border border-parchment-border text-xs text-espresso/70">
                  <span className="font-semibold text-espresso">Referencing Work: </span>
                  <span className="italic font-serif">"{postTitle}"</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-espresso/80 mb-1.5">
                  Your Mentor Note (Guidance & Invitation)
                </label>
                <textarea
                  rows={4}
                  required
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={`Write a thoughtful note to ${shishyaName} sharing your appreciation of their craft and how you can guide them...`}
                  className="w-full p-3 bg-white border border-parchment-border rounded-xl text-sm text-espresso placeholder-espresso/40 resize-none focus:outline-none focus:border-copper"
                />
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed">
                ✦ <strong>Privacy Notice:</strong> The shishya's private contact information (WhatsApp / Instagram / Email) remains confidential until they review and accept your note.
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-medium text-espresso/70 hover:text-espresso"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !note.trim() || !isVerifiedGuru}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-copper text-white rounded-xl text-xs font-semibold hover:bg-copper-600 disabled:opacity-50 transition-all shadow-subtle"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Mentorship Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
