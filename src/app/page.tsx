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
            <div className="hero-text-backing order-2 lg:order-1 reveal">
              <p className="text-accent tracking-[0.35em] uppercase text-[11px] font-medium mb-6">
                Memorial Archive
              </p>
              <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-normal tracking-tight leading-[0.95] mb-6 text-text">
                {artist.name}
              </h1>
              <p className="text-text-muted text-base sm:text-lg tracking-[0.1em] font-light">
                {artist.years}
                <span className="mx-4 text-text-dim/50 font-serif">~</span>
                {artist.alias}
              </p>
              <p className="text-text/70 text-lg sm:text-xl leading-relaxed mt-10 max-w-md font-light italic">
                &ldquo;{artist.tagline}&rdquo;
              </p>
              <div className="flex flex-wrap gap-5 mt-14">
                <a
                  href="#works"
                  className="inline-block bg-accent/90 hover:bg-accent text-bg font-medium rounded-md px-8 py-4 text-sm tracking-widest uppercase transition-all duration-300"
                >
                  Explore the Music
                </a>
                <a
                  href="#about"
                  className="inline-block border border-border hover:border-text-muted/40 rounded-md px-8 py-4 text-sm tracking-widest uppercase text-text-muted hover:text-text transition-all duration-300"
                >
                  About Elijah
                </a>
              </div>
            </div>

            {/* Portrait column */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end relative z-10 reveal delay-200">
              <div className="hero-portrait w-full max-w-[300px] sm:max-w-[340px] lg:max-w-[420px]">
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
      <div className="section-divider max-w-5xl mx-auto opacity-30" />

      <section id="about" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-28 md:py-48">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          {/* Photo — Left side */}
          <div className="lg:col-span-5 reveal">
            <p className="text-accent tracking-[0.3em] uppercase text-[11px] font-medium mb-8">
              Biography
            </p>
            <div className="portrait-vignette aspect-[4/5] relative">
              <Image
                src={artist.images.about}
                alt={`${artist.name} portrait`}
                fill
                className="object-cover grayscale"
              />
            </div>
          </div>

          {/* Bio text — Right side */}
          <div className="lg:col-span-7 space-y-8 lg:pt-16 reveal delay-200">
            <h2 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight mb-4">
              An Audio Novelist
            </h2>
            <div className="space-y-6">
              {artist.bio.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-lg sm:text-xl leading-[1.7] font-light text-text/80"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURED WORKS — Premium cards
          ═══════════════════════════════════════════ */}
      <div className="section-divider max-w-5xl mx-auto opacity-30" />

      <section id="works" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-28 md:py-48">
        <div className="text-center mb-20 reveal">
          <p className="text-accent tracking-[0.35em] uppercase text-[11px] font-medium mb-4">
            Archive
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">
            Selected Works
          </h2>
          <p className="text-text-muted mt-6 max-w-xl mx-auto font-light leading-relaxed">
            A curated selection of projects that define Elijah Nang&rsquo;s cinematic sound and narrative world-building.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 reveal delay-200">
          {artist.featuredWorks.map((work) => (
            <a
              key={work.title}
              href={work.listenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="card-glow group bg-surface border border-border/60 rounded-xl p-8 hover:border-accent/30 transition-all duration-500 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-accent-muted text-[10px] tracking-[0.3em] uppercase font-semibold">
                  {work.type}
                </span>
                <span className="link-arrow text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  &#x2197;
                </span>
              </div>
              <h3 className="font-serif text-3xl font-normal tracking-wide mb-4 text-text group-hover:text-accent transition-colors duration-300">
                {work.title}
              </h3>
              <p className="text-text-muted/80 text-base leading-relaxed mb-10 flex-1 font-light">
                {work.description}
              </p>
              <span className="text-[11px] tracking-[0.2em] uppercase text-text-dim group-hover:text-accent-muted transition-colors duration-300 font-medium">
                {work.listenLabel}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          LEGACY — New cinematic section
          ═══════════════════════════════════════════ */}
      <div className="section-divider max-w-5xl mx-auto opacity-30" />

      <section className="max-w-6xl mx-auto px-6 py-28 md:py-48">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div className="reveal order-2 lg:order-1">
            <h2 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight mb-8">
              {artist.legacy.heading}
            </h2>
            <p className="text-lg sm:text-xl leading-[1.8] font-light text-text/80 mb-10">
              {artist.legacy.text}
            </p>
            <blockquote className="border-l-2 border-accent/40 pl-8 py-2 italic text-xl text-text/70 font-light">
              &ldquo;{artist.legacy.quote}&rdquo;
            </blockquote>
          </div>
          <div className="reveal delay-200 order-1 lg:order-2">
            <div className="portrait-vignette aspect-video relative">
              <Image
                src={artist.images.studio}
                alt={`${artist.name} in the studio`}
                fill
                className="object-cover grayscale"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PLATFORMS — Modernized grid
          ═══════════════════════════════════════════ */}
      <div className="section-divider max-w-5xl mx-auto opacity-30" />

      <section id="listen" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-28 md:py-48">
        <div className="text-center mb-16 reveal">
          <p className="text-accent tracking-[0.3em] uppercase text-[11px] font-medium mb-4">
            Presence
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight">
            Digital Archive
          </h2>
        </div>

        <div id="links" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 reveal delay-200">
          {artist.links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-glow group flex flex-col items-center justify-center gap-3 bg-surface border border-border/40 rounded-lg p-6 text-center hover:border-accent/20 transition-all duration-300"
            >
              <span className="text-[11px] tracking-[0.2em] uppercase text-text-muted group-hover:text-accent transition-colors duration-200">
                {link.label}
              </span>
              <span className="text-accent/40 group-hover:text-accent transition-colors duration-200 text-xs">
                &#x2197;
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CLOSING MEMORIAL — Subtle image with single line
          ═══════════════════════════════════════════ */}
      <section className="memorial-closing relative h-[35vh] md:h-[45vh] flex items-center justify-center overflow-hidden">
        <Image
          src={artist.images.silhouette}
          alt={`${artist.name} silhouette`}
          fill
          className="object-cover object-center opacity-15 grayscale scale-110"
        />
        <div
          className="absolute inset-0 bg-bg/80 z-[1]"
          aria-hidden="true"
        />
        <div className="relative z-10 text-center px-6 reveal">
          <p className="text-2xl sm:text-3xl md:text-4xl font-serif tracking-wide text-text/90 italic mb-4">
            The music lives on.
          </p>
          <p className="text-accent/60 tracking-[0.4em] uppercase text-[10px] font-medium">
            1991 &mdash; 2023
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
      <footer className="bg-bg py-20 md:py-24 border-t border-border/20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-text-muted text-[13px] leading-relaxed max-w-md mx-auto font-light">
            This is an unofficial memorial archive created to honor{" "}
            {artist.name}. All music, video artwork, names, logos, and
            platform content belong to their respective owners.
          </p>

          <div className="w-12 h-[1px] bg-border/60 mx-auto my-12" />

          <p className="font-serif text-2xl text-text/80 mb-2">
            {artist.alias}
          </p>
          <p className="text-text-dim text-[10px] tracking-[0.3em] uppercase">
            {artist.domain}
          </p>
        </div>
      </footer>
    </>
  );
}
