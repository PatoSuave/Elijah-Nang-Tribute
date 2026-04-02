import type { Metadata } from "next";
import "./globals.css";
import MiniPlayer from "@/components/MiniPlayer";
import PetalsBackground from "@/components/PetalsBackground";

export const metadata: Metadata = {
  title: "Elijah Nang — A Tribute",
  description:
    "A memorial archive honoring the life and music of Elijah Nang, also known as Nang Soul.",
  openGraph: {
    title: "Elijah Nang — A Tribute",
    description:
      "A memorial archive honoring the life and music of Elijah Nang.",
    siteName: "Nang Soul",
    type: "website",
  },
};

const navLinks = [
  { href: "#about", label: "About" },
  { href: "#works", label: "Works" },
  { href: "#listen", label: "Listen & Watch" },
  { href: "#links", label: "Links" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen flex flex-col">
        {/* ── Fixed background layers ── */}
        <div className="site-bg-image" aria-hidden="true" />
        <PetalsBackground />
        <div className="site-bg-scrim" aria-hidden="true" />
        <div className="texture-overlay" aria-hidden="true" />

        {/* ── Navigation ── */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border/40">
          <nav className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
            <a
              href="#"
              className="text-sm font-medium tracking-wide text-text hover:text-accent transition-colors duration-200"
            >
              Nang Soul
            </a>
            <ul className="hidden sm:flex items-center gap-8">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[11px] tracking-[0.18em] uppercase text-text-muted hover:text-accent transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="flex-1">{children}</main>
        <MiniPlayer />
      </body>
    </html>
  );
}
