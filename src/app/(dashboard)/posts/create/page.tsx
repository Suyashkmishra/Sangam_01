"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Feather, 
  Music, 
  Video, 
  Upload, 
  Link as LinkIcon, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { PostCategory, ContentLanguage, MediaType } from "@/lib/types/database.types";
import { MediaRenderer } from "@/components/posts/MediaRenderer";

export default function CreatePostPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Form states
  const [category, setCategory] = useState<PostCategory>("poetry");
  const [language, setLanguage] = useState<ContentLanguage>("Hindi");
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [mediaChoice, setMediaChoice] = useState<"none" | "upload" | "embed">("none");
  const [mediaType, setMediaType] = useState<MediaType>("none");
  const [externalLink, setExternalLink] = useState("");

  // Storage upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      setLoading(false);
    }
    checkUser();
  }, [router]);

  // Handle direct file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");

    // Determine type and size limit
    const isAudio = file.type.startsWith("audio/");
    const isVideo = file.type.startsWith("video/");

    if (!isAudio && !isVideo) {
      setErrorMsg("Please upload a valid audio (MP3/WAV/OGG) or video (MP4/WebM) file.");
      return;
    }

    // Storage Size limit enforcement
    // Audio <= 10 MB (10485760 bytes)
    // Video <= 50 MB (52428800 bytes)
    if (isAudio && file.size > 10 * 1024 * 1024) {
      setErrorMsg("Audio files cannot exceed 10 MB per Supabase Storage policy.");
      return;
    }

    if (isVideo && file.size > 50 * 1024 * 1024) {
      setErrorMsg("Video files cannot exceed 50 MB per Supabase Storage policy.");
      return;
    }

    setUploadFile(file);
    setMediaType(isAudio ? "audio" : "video");
  };

  const handleUploadToStorage = async (file: File, userId: string): Promise<string> => {
    setUploading(true);
    setUploadProgress("Uploading media to Supabase Storage...");

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from("post-media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Retrieve public URL
    const { data: publicUrlData } = supabase.storage
      .from("post-media")
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      let finalMediaUrl: string | null = uploadedUrl;
      let finalMediaType: MediaType = mediaType;

      // If user selected file upload, upload first
      if (mediaChoice === "upload" && uploadFile && !finalMediaUrl) {
        finalMediaUrl = await handleUploadToStorage(uploadFile, user.id);
        setUploadedUrl(finalMediaUrl);
      }

      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          category: category,
          language: language,
          title: title.trim(),
          body_text: bodyText.trim() || null,
          media_url: mediaChoice === "upload" ? finalMediaUrl : null,
          media_type: mediaChoice === "upload" ? finalMediaType : "none",
          external_link: mediaChoice === "embed" && externalLink.trim() ? externalLink.trim() : null,
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/posts/${post.id}`);
      router.refresh();
    } catch (err: any) {
      console.error("Post creation error:", err);
      setErrorMsg(err.message || "Failed to publish work.");
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-copper animate-spin mb-2" />
        <p className="text-sm text-espresso/70">Entering the creative atelier...</p>
      </div>
    );
  }

  const scriptFont = language === "Hindi" 
    ? "font-devanagari text-base" 
    : language === "Kannada" 
    ? "font-kannada text-base" 
    : "font-serif text-lg";

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-copper-50 text-copper-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-copper-600" />
            <span>Creative Atelier</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-espresso">
            Publish New Creation
          </h1>
          <p className="text-xs text-espresso/60 mt-1">
            Present your poetry or acoustic composition to the mentors and fellow artists of Sangam.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-parchment-border shadow-subtle space-y-6">
          {/* Category Picker */}
          <div>
            <label className="block text-xs font-semibold text-espresso/80 mb-2">
              Artistic Category
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setCategory("poetry")}
                className={`py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-medium text-xs transition-all ${
                  category === "poetry"
                    ? "border-copper bg-copper-50 text-copper-800 font-bold shadow-subtle"
                    : "border-parchment-border hover:bg-cream-50 text-espresso/70"
                }`}
              >
                <Feather className="w-4 h-4 text-copper-600" />
                <span>Poetry (कविता / ಕಾವ್ಯ / Verse)</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("music")}
                className={`py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-medium text-xs transition-all ${
                  category === "music"
                    ? "border-copper bg-copper-50 text-copper-800 font-bold shadow-subtle"
                    : "border-parchment-border hover:bg-cream-50 text-espresso/70"
                }`}
              >
                <Music className="w-4 h-4 text-copper-600" />
                <span>Music (संगीत / ನಾದ / Composition)</span>
              </button>
            </div>
          </div>

          {/* Language Picker */}
          <div>
            <label className="block text-xs font-semibold text-espresso/80 mb-2">
              Content Language
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["Hindi", "English", "Kannada"] as ContentLanguage[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                    language === lang
                      ? "border-copper bg-copper-100 text-copper-900 font-bold"
                      : "border-parchment-border hover:bg-cream-50 text-espresso/70"
                  }`}
                >
                  {lang === "Hindi" ? "Hindi (हिन्दी)" : lang === "Kannada" ? "Kannada (ಕನ್ನಡ)" : "English"}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-espresso/80 mb-1.5">
              Title of the Work
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === "Hindi" ? "उदा. धूप के साये और सूखी नदी" : language === "Kannada" ? "ಉದಾ. ಬೆಳದಿಂಗಳ ಮೌನದಲ್ಲಿ" : "e.g. Whispers of the Banyan Tree"}
              className="w-full px-4 py-2.5 bg-cream-50/50 border border-parchment-border rounded-xl text-sm font-serif font-bold text-espresso placeholder-espresso/40 focus:outline-none focus:border-copper"
            />
          </div>

          {/* Body Text */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-espresso/80">
                Text / Lyrics / Raga Notes
              </label>
              <span className="text-[11px] text-copper-700 italic">
                {language === "Hindi" ? "देवनागरी लिपि समर्थित" : language === "Kannada" ? "ಕನ್ನಡ ಲಿಪಿ ಬೆಂಬಲಿತ" : "Serif formatting"}
              </span>
            </div>
            <textarea
              rows={7}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder={
                category === "poetry"
                  ? "Type or paste your verses here..."
                  : "Share the musical arrangement, raga, scale, or compositional context..."
              }
              className={`w-full p-4 bg-cream-50/50 border border-parchment-border rounded-xl text-espresso placeholder-espresso/40 resize-none focus:outline-none focus:border-copper ${scriptFont} leading-relaxed`}
            />
          </div>

          {/* Media Attachment Selection */}
          <div>
            <label className="block text-xs font-semibold text-espresso/80 mb-2">
              Attach Performance Audio / Video
            </label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setMediaChoice("none")}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  mediaChoice === "none"
                    ? "border-copper bg-copper-50 text-copper-800 font-bold"
                    : "border-parchment-border text-espresso/70"
                }`}
              >
                No Media
              </button>
              <button
                type="button"
                onClick={() => setMediaChoice("upload")}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  mediaChoice === "upload"
                    ? "border-copper bg-copper-50 text-copper-800 font-bold"
                    : "border-parchment-border text-espresso/70"
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-copper-600" />
                <span>Upload File</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaChoice("embed")}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  mediaChoice === "embed"
                    ? "border-copper bg-copper-50 text-copper-800 font-bold"
                    : "border-parchment-border text-espresso/70"
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5 text-copper-600" />
                <span>Embed Link</span>
              </button>
            </div>

            {/* Direct File Upload Mode */}
            {mediaChoice === "upload" && (
              <div className="bg-cream-50/70 border border-dashed border-copper-300 rounded-xl p-6 text-center space-y-3">
                <input
                  type="file"
                  id="file-upload"
                  accept="audio/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-copper text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-copper-600 shadow-subtle transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Audio or Video File</span>
                </label>

                {uploadFile ? (
                  <div className="text-xs text-espresso/80 bg-white p-3 rounded-lg border border-parchment-border inline-block max-w-sm truncate">
                    <span className="font-semibold">{uploadFile.name}</span>
                    <span className="text-espresso/50 ml-2">
                      ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-espresso/60">
                    Direct Supabase Storage: Audio up to 10 MB &bull; Video up to 50 MB
                  </p>
                )}
              </div>
            )}

            {/* External Embed Link Mode */}
            {mediaChoice === "embed" && (
              <div className="space-y-3">
                <input
                  type="url"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="Paste YouTube or Instagram link (e.g. https://www.youtube.com/watch?v=...)"
                  className="w-full px-4 py-2.5 bg-cream-50/50 border border-parchment-border rounded-xl text-xs text-espresso placeholder-espresso/40 focus:outline-none focus:border-copper"
                />

                {externalLink && (
                  <div className="mt-2">
                    <p className="text-[11px] font-semibold text-espresso/70 mb-1">Live Embed Preview:</p>
                    <MediaRenderer externalLink={externalLink} />
                  </div>
                )}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4 border-t border-parchment-border flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-xs font-medium text-espresso/70 hover:text-espresso"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || uploading || !title.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-copper text-white rounded-xl text-xs font-semibold hover:bg-copper-600 disabled:opacity-60 transition-all shadow-subtle"
            >
              {submitting || uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadProgress || "Publishing to Confluence..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publish Creation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

