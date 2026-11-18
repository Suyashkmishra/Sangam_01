"use client";

import React, { useState, useEffect } from "react";
import { X, Feather, Music, AlertTriangle, Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Post, PostCategory, ContentLanguage } from "@/lib/types/database.types";

interface EditAndResubmitModalProps {
  isOpen: boolean;
  post: Post | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function EditAndResubmitModal({
  isOpen,
  post,
  onClose,
  onSuccess,
}: EditAndResubmitModalProps) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [category, setCategory] = useState<PostCategory>("poetry");
  const [language, setLanguage] = useState<ContentLanguage>("Hindi");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (post) {
      setTitle(post.title || "");
      setBodyText(post.body_text || "");
      setCategory(post.category || "poetry");
      setLanguage(post.language || "Hindi");
      setErrorMsg("");
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please provide a title for your creation.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/posts/resubmit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          postId: post.id,
          title: title.trim(),
          bodyText: bodyText.trim(),
          category,
          language,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to resubmit work");
      }

      onSuccess(json.message || "Your work has been revised and submitted for curatorial review.");
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resubmit creation.");
    } finally {
      setLoading(false);
    }
  };

  const scriptFont = language === "Hindi" 
    ? "font-devanagari text-sm" 
    : language === "Kannada" 
    ? "font-kannada text-sm" 
    : "font-serif text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl border border-parchment-border shadow-floating max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 border-b border-parchment-border pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-espresso">Edit and Resubmit Work</h3>
            <p className="text-xs text-espresso/60">
              Revise your creation according to guardian feedback before resubmitting.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-espresso/40 hover:text-espresso p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Previous moderation feedback */}
        {post.moderation_reason && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Guardian Feedback</span>
            </div>
            <p className="text-xs italic text-amber-900/90 pl-5">
              “{post.moderation_reason}”
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-espresso/80 mb-1">Category</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("poetry")}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    category === "poetry"
                      ? "border-copper bg-copper-50 text-copper font-bold"
                      : "border-parchment-border text-espresso/70 hover:bg-cream-50"
                  }`}
                >
                  <Feather className="w-3.5 h-3.5" />
                  <span>Poetry</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory("music")}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    category === "music"
                      ? "border-copper bg-copper-50 text-copper font-bold"
                      : "border-parchment-border text-espresso/70 hover:bg-cream-50"
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Music</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-espresso/80 mb-1">Linguistic Heritage</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as ContentLanguage)}
                className="w-full text-xs p-2.5 rounded-lg border border-parchment-border bg-white focus:outline-none focus:ring-2 focus:ring-copper"
              >
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-espresso/80 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full p-2.5 rounded-lg border border-parchment-border bg-white focus:outline-none focus:ring-2 focus:ring-copper ${scriptFont}`}
              placeholder="Title of your work"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-espresso/80 mb-1">Verses / Composition</label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={6}
              className={`w-full p-3 rounded-lg border border-parchment-border bg-white focus:outline-none focus:ring-2 focus:ring-copper leading-relaxed ${scriptFont}`}
              placeholder="Revised poetic verses or acoustic composition details..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-parchment-border">
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
              disabled={loading || !title.trim()}
              className="px-5 py-2 text-xs font-semibold bg-copper hover:bg-copper-600 text-white rounded-xl transition-all shadow-subtle flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Resubmit for Review</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
