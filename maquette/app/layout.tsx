import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Engineering Studio — Maquette",
  description: "Engineering Studio réunit les outils OP-1 et EP-133 K.O. II dans un atelier musical local au design pixel art.",
  keywords: ["Engineering Studio", "OP-1 Studio", "EP-133 K.O. II", "Teenage Engineering", "sampler", "pixel art", "atelier musical"],
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
