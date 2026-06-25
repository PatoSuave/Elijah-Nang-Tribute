import Image from "next/image";
import { artist } from "@/content/artist";

const SOUNDCLOUD_URL =
  "https://w.soundcloud.com/player/?visual=true&url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F1952326379&show_artwork=true&color=%23d4a55a&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=false";

const archiveStats = [
  { label: "Mode", value: "Audio novel" },
  { label: "Archive", value: artist.alias },
  { label: "Era", value: artist.years },
  { label: "Worlds", value: "Gaijin / Misogi / Akira" },
];

const chapterNotes = [
  "A sweeping journey through East-Asian inspired soundscapes.",
  "A continuation of the world established in Gaijin.",
  "An introspective album rooted in purification and renewal.",
  "A dreamlike exploration of warmth, memory, and wonder.",
  "A rhythmic look into the broader Nang Soul identity.",
  "A foundational project shaped by setting and memory.",
];

export default function Home() {
  return (
    <article className="site-shell">
      <section className="portal-hero" id="overview">
        <Image
          src={artist.images.silhouette}
          alt=""
          fill
          priority
          className="portal-hero-silhouette"
          aria-hidden="true"
        />
        <div className="portal-hero-wash" aria-hidden="true" />

        <div className="portal-hero-grid">
          <div className="hero-copy reveal">
            <p className="section-kicker">Nang World Portal / Memorial Archive</p>
            <h1 className="portal-title">
              <span>Nang Soul</span>
              <span>Elijah Nang</span>
            </h1>
            <p className="hero-years">{artist.years}</p>
            <p className="hero-intro">
              {artist.tagline} A place to listen first, then move through the
              worlds he built as chapters in an audio novel.
            </p>

            <div className="hero-actions">
              <a className="primary-action" href="#listen">
                Start Listening
              </a>
              <a className="secondary-action" href="#works">
                Browse Chapters
              </a>
            </div>

            <div className="listening-room" id="listen">
              <div className="listening-room-header">
                <div>
                  <p className="micro-label">SoundCloud Player</p>
                  <h2>Ho Chi Minh City Beat 255</h2>
                </div>
                <a
                  href="https://soundcloud.com/elijahnang/ho-chi-minh-city-beat-255"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open on SoundCloud
                </a>
              </div>
              <iframe
                title="Ho Chi Minh City (Beat 255) by Elijah Nang on SoundCloud"
                width="100%"
                height="400"
                scrolling="no"
                frameBorder="no"
                allow="autoplay; encrypted-media"
                loading="lazy"
                src={SOUNDCLOUD_URL}
              />
            </div>
          </div>

          <aside className="hero-visual-stack reveal delay-200">
            <div className="portrait-panel">
              <Image
                src={artist.images.hero}
                alt={`Portrait of ${artist.name}`}
                width={620}
                height={700}
                priority
                className="portrait-panel-image"
              />
              <div className="portrait-caption">
                <span>Audio Novelist</span>
                <strong>{artist.alias}</strong>
              </div>
            </div>

            <div className="chapter-rail" aria-label="Featured chapters">
              <p className="micro-label">Chapters</p>
              {artist.featuredWorks.slice(0, 4).map((work, index) => (
                <a key={work.title} href="#works" className="chapter-rail-row">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{work.title}</strong>
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="archive-band" aria-label="Archive metadata">
        <div className="archive-stat-grid">
          {archiveStats.map((item) => (
            <div key={item.label} className="archive-stat">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="editorial-section about-section">
        <div className="section-heading reveal">
          <p className="section-kicker">Origin File</p>
          <h2>The person behind the portal.</h2>
        </div>

        <div className="about-grid">
          <div className="about-image reveal">
            <Image
              src={artist.images.about}
              alt={`${artist.name} portrait`}
              fill
              className="object-cover grayscale"
            />
          </div>

          <div className="bio-copy reveal delay-200">
            {artist.bio.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section id="works" className="editorial-section works-section">
        <div className="works-header reveal">
          <div>
            <p className="section-kicker">World Chapters</p>
            <h2>Enter the records like places.</h2>
          </div>
          <p>
            Option 3 puts the work up front: each release reads as a world,
            a mood, and a doorway back into the music.
          </p>
        </div>

        <div className="chapter-grid reveal delay-200">
          {artist.featuredWorks.map((work, index) => (
            <a
              key={work.title}
              href={work.listenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="chapter-card"
            >
              <span className="chapter-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="chapter-type">{work.type}</span>
              <h3>{work.title}</h3>
              <p>{chapterNotes[index] ?? work.description}</p>
              <span className="chapter-link">{work.listenLabel}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="world-section">
        <div className="world-image reveal">
          <Image
            src={artist.images.studio}
            alt={`${artist.name} in the studio`}
            fill
            className="object-cover grayscale"
          />
        </div>

        <div className="world-copy reveal delay-200">
          <p className="section-kicker">Legacy</p>
          <h2>{artist.legacy.heading}</h2>
          <p>{artist.legacy.text}</p>
          <blockquote>&ldquo;{artist.legacy.quote}&rdquo;</blockquote>
        </div>
      </section>

      <section id="links" className="editorial-section platforms-section">
        <div className="section-heading reveal">
          <p className="section-kicker">Exit Points</p>
          <h2>Keep exploring the archive.</h2>
        </div>

        <div className="platform-list reveal delay-200">
          {artist.links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{link.label}</span>
              <strong>Open archive</strong>
            </a>
          ))}
        </div>
      </section>

      <section className="memorial-close">
        <Image
          src={artist.images.artwork}
          alt=""
          fill
          className="memorial-close-art"
          aria-hidden="true"
        />
        <div>
          <p>The music lives on.</p>
          <span>{artist.years}</span>
        </div>
      </section>

      <footer className="site-footer">
        <p>
          This is an unofficial memorial archive created to honor {artist.name}.
          All music, video artwork, names, logos, and platform content belong to
          their respective owners.
        </p>
        <strong>{artist.domain}</strong>
      </footer>
    </article>
  );
}
