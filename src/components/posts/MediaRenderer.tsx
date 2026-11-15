"use client";

import React from "react";
import { Music, Video, ExternalLink, Play } from "lucide-react";
import { parseMediaEmbed } from "@/lib/utils/media-embed";
import { MediaType } from "@/lib/types/database.types";

interface MediaRendererProps {
  mediaUrl?: string | null;
  mediaType?: MediaType;
  externalLink?: string | null;
  title?: string;
}

export function MediaRenderer({
  mediaUrl,
  mediaType = "none",
  externalLink,
  title,
}: MediaRendererProps) {
  const embed = parseMediaEmbed(externalLink);

  // If there's an external embed (YouTube / Instagram)
  if (embed.type === "youtube" && embed.embedUrl) {
    return (
      <div className="w-full my-4 rounded-2xl overflow-hidden border border-parchment-border shadow-subtle bg-espresso/5 aspect-video relative">
        <iframe
          src={embed.embedUrl}
          title={title || "YouTube video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  if (embed.type === "instagram" && embed.embedUrl) {
    return (
      <div className="w-full my-4 flex justify-center">
        <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-parchment-border shadow-subtle bg-white aspect-[4/5]">
          <iframe
            src={embed.embedUrl}
            title={title || "Instagram post embed"}
            allowTransparency
            frameBorder="0"
            scrolling="no"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    );
  }

  // Direct Audio player
  if (mediaType === "audio" && mediaUrl) {
    return (
      <div className="w-full my-4 bg-parchment border border-copper-200/80 rounded-2xl p-4 shadow-subtle">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-copper-100 text-copper-800 flex items-center justify-center flex-shrink-0">
            <Music className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-espresso truncate">
              {title || "Acoustic Audio Performance"}
            </p>
            <p className="text-[11px] text-copper-700">High-fidelity Studio Stream</p>
          </div>
        </div>
        <audio
          controls
          src={mediaUrl}
          className="w-full h-10 rounded-lg accent-copper"
          preload="metadata"
        >
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  // Direct Video player
  if (mediaType === "video" && mediaUrl) {
    return (
      <div className="w-full my-4 rounded-2xl overflow-hidden border border-parchment-border shadow-subtle bg-black">
        <video
          controls
          src={mediaUrl}
          className="w-full max-h-[460px] object-contain mx-auto"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // If there's an external link without direct embed
  if (externalLink && embed.type === "direct") {
    return (
      <div className="w-full my-3 p-3 bg-cream-100 rounded-xl border border-parchment-border flex items-center justify-between text-xs">
        <span className="text-espresso/70 truncate mr-2">External Link: {externalLink}</span>
        <a
          href={externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-copper hover:text-copper-700 font-semibold flex-shrink-0"
        >
          <span>Open</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return null;
}
