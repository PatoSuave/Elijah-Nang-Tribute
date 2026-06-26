import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import MiniPlayer from "@/components/MiniPlayer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Elijah Nang - Music Archive",
  description:
    "A music-first memorial archive honoring the life and work of Elijah Nang, also known as Nang Soul.",
  openGraph: {
    title: "Elijah Nang - Music Archive",
    description:
      "A music-first memorial archive honoring the life and work of Elijah Nang.",
    siteName: "Nang Soul",
    type: "website",
  },
};

const navLinks = [
  { href: "#listen", label: "Listen" },
  { href: "#works", label: "Works" },
  { href: "#about", label: "About" },
  { href: "#links", label: "Links" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`antialiased ${inter.variable} ${instrumentSerif.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <div className="site-bg-image" aria-hidden="true" />
        <div className="site-bg-scrim" aria-hidden="true" />
        <div className="texture-overlay" aria-hidden="true" />

        <header className="site-header">
          <nav className="site-nav" aria-label="Primary navigation">
            <a href="#overview" className="site-brand">
              Nang Soul Archive
            </a>
            <ul>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="site-main">{children}</main>
        <MiniPlayer />
      </body>
    </html>
  );
}
