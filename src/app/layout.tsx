import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sangam (संगम) — Sacred Ink meets Digital Soul",
  description: "A cultural sanctuary connecting emerging poets and musicians (Shishya) with legendary mentors (Guru).",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-espresso selection:bg-copper-100 selection:text-espresso font-sans">
        {children}
      </body>
    </html>
  );
}
