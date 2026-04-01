import Image from "next/image";
import { artist } from "@/content/artist";

export default function Home() {
  return (
    <>
      {/* ═══════════════════════════════════════════
          HERO — Two-column with portrait
          ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-14">
        <div className="hero-atmosphere" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text column */}
            <div className="order-2 lg:order-1">
              <p className="text-accent tracking-[0.35em] uppercase text-[11px] font-medium mb-6">
                Memorial Archive
              </p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extralight tracking-tight leading-[1.05] mb-5">
                {artist.name}
              </h1>
              <p className="text-text-muted text-base sm:text-lg tracking-wide">
                {artist.years}
                <span className="mx-3 text-text-dim">~</span>
                {artist.alias}
              </p>
              <p className="text-text-muted text-base sm:text-lg leading-relaxed mt-8 max-w-md">
                {artist.tagline}
              </p>
              <div className="flex flex-wrap gap-4 mt-12">
                <a
                  href="#works"
                  className="inline-block border border-accent/30 hover:border-accent/60 hover:bg-accent/5 rounded-md px-7 py-3 text-sm tracking-wide text-accent transition-all duration-300"
                >
                  Explore the Music
                </a>
                <a
                  href="#about"
                  className="inline-block border border-border hover:border-border-hover rounded-md px-7 py-3 text-sm tracking-wide text-text-muted hover:text-text transition-all duration-300"
                >
                  About Elijah
                </a>
              </div>
            </div>

            {/* Portrait column */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="portrait-vignette w-full max-w-xs sm:max-w-sm lg:max-w-md">
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
          MEMORIAL BANNER — Silhouette image
          ═══════════════════════════════════════════ */}
      <section className="memorial-banner relative h-[50vh] md:h-[60vh] flex items-center justify-center">
        <Image
          src={artist.images.silhouette}
          alt={`${artist.name} silhouette`}
          fill
          className="object-cover object-center opacity-40"
        />
        <div className="relative z-10 text-center px-6">
          <p className="text-accent/70 tracking-[0.4em] uppercase text-[11px] mb-4">
            Rest in peace
          </p>
          <p className="text-3xl sm:text-4xl md:text-5xl font-extralight tracking-tight text-text/90">
            {artist.name}
          </p>
          <p className="text-text-muted text-sm tracking-widest mt-4">
            {artist.years}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
      <footer className="border-t border-border/40 py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-text-muted text-xs leading-relaxed max-w-lg mx-auto">
            This is an unofficial memorial archive created to honor{" "}
            {artist.name}. All music, video artwork, names, logos, and
            platform content belong to their respective owners.
          </p>
          <div className="flex items-center justify-center gap-3 mt-10">
            <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center">
              <span className="text-accent text-[8px]">&#9834;</span>
            </div>
            <span className="text-sm font-medium tracking-wide text-text-muted">
              {artist.alias}
            </span>
          </div>
          <p className="text-text-dim text-[11px] mt-3 tracking-widest">
            {artist.domain}
          </p>
        </div>
      </footer>
    </>
  );
}
