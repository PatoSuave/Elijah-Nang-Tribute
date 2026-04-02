import Image from "next/image";
import { artist } from "@/content/artist";

export default function Home() {
  return (
    <>
      {/* ═══════════════════════════════════════════
          HERO — Two-column with portrait
          ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-14">
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Text column */}
            <div className="hero-text-backing order-2 lg:order-1">
              <p className="text-accent tracking-[0.35em] uppercase text-[11px] font-medium mb-6">
                Memorial Archive
              </p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight leading-[1.05] mb-5 text-text">
                {artist.name}
              </h1>
              <p className="text-text-muted text-base sm:text-lg tracking-wide">
                {artist.years}
                <span className="mx-3 text-text-dim">~</span>
                {artist.alias}
              </p>
              <p className="text-text/70 text-base sm:text-lg leading-relaxed mt-8 max-w-md">
                {artist.tagline}
              </p>
              <div className="flex flex-wrap gap-4 mt-12">
                <a
                  href="#works"
                  className="inline-block bg-accent/90 hover:bg-accent text-bg font-medium rounded-md px-7 py-3 text-sm tracking-wide transition-all duration-300"
                >
                  Explore the Music
                </a>
                <a
                  href="#about"
                  className="inline-block border border-border hover:border-text-muted/40 rounded-md px-7 py-3 text-sm tracking-wide text-text-muted hover:text-text transition-all duration-300"
                >
                  About Elijah
                </a>
              </div>
            </div>

            {/* Portrait column */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end relative z-10">
              <div className="hero-portrait w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[380px]">
                <Image
                  src={artist.images.hero}
                  alt={`Portrait of ${artist.name}`}
                  width={600}
                  height={750}
                  priority
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ABOUT — Photo + bio side by side
          ═══════════════════════════════════════════ */}
      <div className="section-divider max-w-5xl mx-auto" />

      <section id="about" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-28 md:py-40">
        <p className="text-accent tracking-[0.3em] uppercase text-[11px] font-medium mb-4">
          About
        </p>
        <h2 className="text-3xl sm:text-4xl font-extralight tracking-tight mb-16">
          About Elijah
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-16 items-start">
          {/* Photo — 2 columns */}
          <div className="md:col-span-2">
            <div className="portrait-vignette">
              <Image
                src={artist.images.about}
                alt={`${artist.name} portrait`}
                width={480}
                height={600}
                className="w-full h-auto object-cover grayscale"
              />
            </div>
          </div>

          {/* Bio text — 3 columns */}
          <div className="md:col-span-3 space-y-6 md:pt-2">
            {artist.bio.map((paragraph, i) => (
              <p
                key={i}
                className="text-base sm:text-lg leading-[1.8] font-light text-text/85"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURED WORKS — Premium cards
          ═══════════════════════════════════════════ */}
      <div className="section-divider max-w-5xl mx-auto" />

      <section id="works" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-28 md:py-40">
        <p className="text-accent tracking-[0.3em] uppercase text-[11px] font-medium mb-4">
          Featured Works
        </p>
        <h2 className="text-3xl sm:text-4xl font-extralight tracking-tight mb-16">
          Selected Releases
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {artist.featuredWorks.map((work) => (
            <a
              key={work.title}
              href={work.listenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="card-glow group bg-surface border border-border rounded-xl p-7 hover:border-border-hover transition-all duration-300 flex flex-col"
            >
              <p className="text-accent-muted text-[10px] tracking-[0.25em] uppercase mb-4">
                {work.type}
              </p>
              <h3 className="text-2xl font-light tracking-tight mb-3 text-text group-hover:text-accent transition-colors duration-300">
                {work.title}
              </h3>
              <p className="text-text-muted text-sm leading-relaxed mb-8 flex-1">
                {work.description}
              </p>
              <span className="inline-flex items-center gap-2 text-xs tracking-wide text-text-muted group-hover:text-accent transition-colors duration-200">
                {work.listenLabel}
                <span className="link-arrow text-[10px]">&#x2197;</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          STUDIO — Atmospheric image break
          ═══════════════════════════════════════════ */}
      <div className="section-divider max-w-5xl mx-auto" />

      <section className="max-w-6xl mx-auto px-6 py-28 md:py-40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="portrait-vignette">
            <Image
              src={artist.images.studio}
              alt={`${artist.name} in the studio`}
              width={700}
              height={500}
              className="w-full h-auto object-cover grayscale"
            />
          </div>
          <div className="md:pl-6">
            <blockquote className="text-xl sm:text-2xl font-extralight leading-relaxed text-text/80 italic">
              &ldquo;Each project felt like a chapter, carrying listeners
              through vivid, cinematic worlds filled with emotion, memory,
              and story.&rdquo;
            </blockquote>
            <p className="mt-6 text-text-dim text-sm tracking-wide">
              — On his creative philosophy
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          LISTEN & WATCH — Platform links
          ═══════════════════════════════════════════ */}
      <div className="section-divider max-w-5xl mx-auto" />

      <section id="listen" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-28 md:py-40">
        <p className="text-accent tracking-[0.3em] uppercase text-[11px] font-medium mb-4">
          Listen &amp; Watch
        </p>
        <h2 className="text-3xl sm:text-4xl font-extralight tracking-tight mb-16">
          Platforms
        </h2>

        <div id="links" className="scroll-mt-20 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {artist.links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-glow group flex items-center justify-center gap-2 bg-surface border border-border rounded-lg px-5 py-5 text-sm tracking-wide text-text-muted hover:text-accent hover:border-accent/25 transition-all duration-300"
            >
              {link.label}
              <span className="link-arrow text-[10px]">&#x2197;</span>
            </a>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CLOSING MEMORIAL — Subtle image with single line
          ═══════════════════════════════════════════ */}
      <section className="memorial-closing relative h-[28vh] md:h-[32vh] flex items-center justify-center overflow-hidden">
        <Image
          src={artist.images.silhouette}
          alt={`${artist.name} silhouette`}
          fill
          className="object-cover object-center opacity-20"
        />
        {/* Heavy overlay for readability */}
        <div
          className="absolute inset-0 bg-bg/70 z-[1]"
          aria-hidden="true"
        />
        <p className="relative z-10 text-lg sm:text-xl md:text-2xl font-extralight tracking-wide text-text/80 text-center px-6 italic">
          The music lives on.
        </p>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
      <div className="section-divider" aria-hidden="true" />

      <footer className="bg-bg py-14 md:py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-text-muted text-[13px] leading-relaxed max-w-md mx-auto">
            This is an unofficial memorial archive created to honor{" "}
            {artist.name}. All music, video artwork, names, logos, and
            platform content belong to their respective owners.
          </p>

          <div className="section-divider max-w-xs mx-auto my-8" />

          <p className="text-text/60 text-sm font-medium tracking-widest uppercase">
            {artist.alias}
          </p>
          <p className="text-text-dim text-xs mt-2 tracking-widest">
            {artist.domain}
          </p>
        </div>
      </footer>
    </>
  );
}
