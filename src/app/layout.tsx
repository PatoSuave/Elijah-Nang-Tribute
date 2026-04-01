import type { Metadata } from "next";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen flex flex-col">
        <div className="texture-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
