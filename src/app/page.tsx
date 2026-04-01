import Image from "next/image";
import { artist } from "@/content/artist";

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-14">
        <div className="hero-atmosphere" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Text */}
            <div className="order-2 lg:order-1">
              <p className="text-accent tracking-[0.35em] uppercase text-xs mb-5">
                Memorial Archive
              </p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight leading-[1.05] mb-4">
                {artist.name}
              </h1>
              <p className="text-text-muted text-base sm:text-lg tracking-wide mb-2">
                {artist.years} &nbsp;~&nbsp; {artist.alias}
              </p>
              <p className="text-text-muted text-base sm:text-lg leading-relaxed mt-6 max-w-md">
                {artist.tagline}
              </p>
              <div className="flex flex-wrap gap-4 mt-10">
                <a
                  href="#works"
                  className="inline-block border border-border hover:border-accent/40 rounded px-6 py-3 text-sm tracking-wide text-text hover:text-accent transition-all duration-300"
                >
                  Explore the Music
                </a>
                <a
                  href="#about"
                  className="inline-block border border-border hover:border-accent/40 rounded px-6 py-3 text-sm tracking-wide text-text hover:text-accent transition-all duration-300"
                >
                  About Elijah
                </a>
              </div>
            </div>

            {/* Right — Portrait */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="portrait-frame w-full max-w-sm sm:max-w-md lg:max-w-lg">
                <Image
                  src={artist.heroImage}
                  alt={`Portrait of ${artist.name}`}
                  width={600}
                  height={750}
                  priority
                  className="w-full h-auto rounded-xl object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="section-divider max-w-5xl mx-auto" aria-hidden="true" />

      {/* ── About ── */}
      <section id="about" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-28 md:py-36">
        <p className="text-accent tracking-[0.3em] uppercase text-xs mb-4">
          About
        </p>
        <h2 className="text-3xl sm:text-4xl font-light tracking-tight mb-14">
          About Elijah
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* About image */}
          <div className="portrait-frame">
            <Image
              src={artist.heroImage}
              alt={`${artist.name}`}
              width={500}
              height={600}
              className="w-full h-auto rounded-lg object-cover max-h-[480px]"
            />
          </div>

          {/* About text */}
          <div className="space-y-6">
            {artist.bio.map((paragraph, i) => (
              <p
                key={i}
                className="text-base sm:text-lg leading-relaxed font-light text-text/90"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="section-divider max-w-5xl mx-auto" aria-hidden="true" />

      {/* ── Featured Works ── */}
      <section id="works" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-28 md:py-36">
        <p className="text-accent tracking-[0.3em] uppercase text-xs mb-4">
          Featured Works
        </p>
        <h2 className="text-3xl sm:text-4xl font-light tracking-tight mb-14">
          Selected Releases
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {artist.featuredWorks.map((work) => (
            <article
              key={work.title}
              className="group bg-surface border border-border rounded-xl p-6 hover:border-border-hover transition-all duration-300"
            >
              <p className="text-accent-dim text-xs tracking-[0.2em] uppercase mb-3">
                {work.type}
              </p>
              <h3 className="text-xl sm:text-2xl font-light tracking-tight mb-3 text-text group-hover:text-accent transition-colors duration-300">
                {work.title}
              </h3>
              <p className="text-text-muted text-sm leading-relaxed mb-6">
                {work.description}
              </p>
              <a
                href={work.listenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs tracking-wide text-text-muted hover:text-accent transition-colors duration-200"
              >
                {work.listenLabel}
                <span aria-hidden="true" className="text-[10px]">&#x2197;</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="section-divider max-w-5xl mx-auto" aria-hidden="true" />

      {/* ── Listen & Watch ── */}
      <section id="listen" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-28 md:py-36">
        <p className="text-accent tracking-[0.3em] uppercase text-xs mb-4">
          Listen &amp; Watch
        </p>
        <h2 className="text-3xl sm:text-4xl font-light tracking-tight mb-14">
          Platforms
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {artist.links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center border border-border rounded-lg px-5 py-5 text-sm tracking-wide text-text-muted hover:text-accent hover:border-accent/30 hover:bg-surface transition-all duration-300"
            >
              {link.label}
              <span
                aria-hidden="true"
                className="ml-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                &#x2197;
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="section-divider max-w-5xl mx-auto" aria-hidden="true" />

      {/* ── Footer ── */}
      <footer className="mt-auto py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-text-muted text-xs leading-relaxed max-w-lg mx-auto">
            This is an unofficial memorial archive created to honor {artist.name}.
            All music, video artwork, names, logos, and platform content belong to
            their respective owners.
          </p>
          <div className="flex items-center justify-center gap-3 mt-10">
            <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center">
              <span className="text-accent text-[8px]">&#9834;</span>
            </div>
            <span className="text-sm font-medium tracking-wide text-text-muted">
              {artist.alias}
            </span>
          </div>
          <p className="text-text-muted/40 text-[11px] mt-3 tracking-wide">
            {artist.domain}
          </p>
        </div>
      </footer>
    </>
  );
}
