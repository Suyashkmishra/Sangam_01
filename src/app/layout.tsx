import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sangam (संगम) — Sacred Ink meets Digital Soul",
  description: "A cultural sanctuary connecting emerging poets and musicians (Shishya) with legendary mentors (Guru).",
  icons: {
    icon: "/logo.svg",
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
