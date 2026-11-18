"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AdminPostActionModalProps {
  isOpen: boolean;
  action: "suspend" | "delete" | "reject" | null;
  post: {
    id: string;
    title: string;
    author?: { full_name?: string } | null;
  } | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function AdminPostActionModal({
  isOpen,
  action,
  post,
  onClose,
  onSuccess,
}: AdminPostActionModalProps) {
  const supabase = createClient();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !post || !action) return null;

  const isDelete = action === "delete";
  const isSuspend = action === "suspend";
  const isReject = action === "reject";

  const titleText = isDelete
    ? "Delete Creation Permanently"
    : isSuspend
    ? "Suspend Creation"
    : "Reject Resubmitted Creation";

  const confirmBtnText = isDelete
    ? "Permanently Delete"
    : isSuspend
    ? "Suspend Work"
    : "Reject Resubmission";

  const confirmBtnColor = isDelete
    ? "bg-red-700 hover:bg-red-800 text-white"
    : isSuspend
    ? "bg-amber-700 hover:bg-amber-800 text-white"
    : "bg-espresso hover:bg-espresso/90 text-cream";

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg("A detailed reason is strictly required for this administrative action.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          action,
          postId: post.id,
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Failed to ${action} post`);
      }

      setReason("");
      onSuccess(json.message || `Post ${action}ed successfully.`);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to execute administrative action.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl border border-parchment-border shadow-floating max-w-lg w-full p-6 space-y-5"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 border-b border-parchment-border pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDelete ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              {isDelete ? <Trash2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-espresso">{titleText}</h3>
              <p className="text-[11px] text-espresso/60">Guardian moderation & community safety policy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-espresso/40 hover:text-espresso p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post details box */}
        <div className="bg-cream-50 p-4 rounded-xl border border-parchment-border space-y-1">
          <p className="text-xs text-espresso/60 font-semibold uppercase tracking-wider">Target Creation</p>
          <p className="font-serif text-base font-bold text-espresso truncate">“{post.title}”</p>
          <p className="text-xs text-copper-800 font-medium">
            Artist: {post.author?.full_name || "Unknown Artist"}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-espresso mb-1">
              Administrative Reason <span className="text-red-600">*</span>
            </label>
            <p className="text-[11px] text-espresso/60 mb-2">
              This message will be recorded in the audit log and delivered to the artist.
            </p>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              rows={3}
              placeholder={
                isDelete
                  ? "Explain why this post must be permanently purged (e.g. Copyright infringement, abusive content)..."
                  : "Explain why this post is suspended and how the author can revise it..."
              }
              className="w-full text-xs p-3 rounded-xl border border-parchment-border focus:outline-none focus:ring-2 focus:ring-copper bg-white resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-espresso/70 hover:text-espresso rounded-xl border border-parchment-border bg-white hover:bg-cream-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all shadow-subtle flex items-center gap-1.5 ${confirmBtnColor} disabled:opacity-50`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{confirmBtnText}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
