/**
 * Utility functions to extract embeddable URLs for YouTube and Instagram
 */

export function parseMediaEmbed(url: string | null | undefined): {
  type: "youtube" | "instagram" | "direct" | null;
  embedUrl: string | null;
} {
  if (!url) return { type: null, embedUrl: null };

  const trimmed = url.trim();

  // YouTube matchers:
  // - https://www.youtube.com/watch?v=dQw4w9WgXcQ
  // - https://youtu.be/dQw4w9WgXcQ
  // - https://www.youtube.com/embed/dQw4w9WgXcQ
  // - https://www.youtube.com/shorts/dQw4w9WgXcQ
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`,
    };
  }

  // Instagram matchers:
  // - https://www.instagram.com/p/C-abc123/
  // - https://www.instagram.com/reel/C-abc123/
  const igMatch = trimmed.match(
    /instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/i
  );
  if (igMatch && igMatch[1]) {
    return {
      type: "instagram",
      embedUrl: `https://www.instagram.com/p/${igMatch[1]}/embed/captioned`,
    };
  }

  // Direct media URL fallback
  return {
    type: "direct",
    embedUrl: trimmed,
  };
}
