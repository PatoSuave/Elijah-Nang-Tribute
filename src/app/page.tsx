import { artist } from "@/content/artist";

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center min-h-[85vh] px-6 text-center overflow-hidden">
        <div className="hero-glow" aria-hidden="true" />
        <p className="relative z-10 text-text-muted tracking-[0.35em] uppercase text-xs mb-6">
          In memory of
        </p>
        <h1 className="relative z-10 text-5xl sm:text-7xl md:text-8xl font-light tracking-tight leading-none mb-4">
          {artist.name}
        </h1>
        <p className="relative z-10 text-text-muted text-lg sm:text-xl tracking-wide mt-2">
          {artist.alias}
        </p>
        <div className="relative z-10 w-12 h-px bg-accent/40 mt-12" />
      </section>

      {/* ── About ── */}
      <section className="max-w-2xl mx-auto px-6 py-28 md:py-36">
        <h2 className="text-text-muted tracking-[0.3em] uppercase text-xs mb-10">
          About
        </h2>
        <div className="space-y-6">
          {artist.bio.map((paragraph, i) => (
            <p
              key={i}
              className="text-lg sm:text-xl leading-relaxed font-light text-text/90"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* ── Featured Works ── */}
      <section className="max-w-3xl mx-auto px-6 py-28 md:py-36">
        <h2 className="text-text-muted tracking-[0.3em] uppercase text-xs mb-14">
          Featured Works
        </h2>
        <div className="space-y-16">
          {artist.featuredWorks.map((work) => (
            <article key={work.title} className="group">
              <h3 className="text-2xl sm:text-3xl font-light tracking-tight mb-3 text-text group-hover:text-accent transition-colors duration-300">
                {work.title}
              </h3>
              <p className="text-text-muted text-base sm:text-lg leading-relaxed max-w-xl">
                {work.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Links ── */}
      <section className="max-w-2xl mx-auto px-6 py-28 md:py-36">
        <h2 className="text-text-muted tracking-[0.3em] uppercase text-xs mb-14">
          Listen &amp; Follow
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {artist.links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-border rounded-lg px-5 py-4 text-center text-sm tracking-wide text-text-muted hover:text-accent hover:border-accent/30 transition-all duration-300"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
          <p className="text-text-muted text-xs leading-relaxed max-w-md mx-auto">
            This site is an independent, fan-made tribute and is not affiliated
            with or endorsed by the artist&apos;s estate or any official entity.
            All rights to the music and related content belong to their
            respective owners.
          </p>
          <p className="text-text-muted/50 text-xs mt-6">
            {artist.domain}
          </p>
        </div>
      </footer>
    </>
  );
}
