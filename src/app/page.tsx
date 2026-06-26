import Image from "next/image";
import {
  FaExternalLinkAlt,
  FaEnvelope,
  FaFacebookF,
  FaHeadphones,
  FaInstagram,
  FaMusic,
  FaPlay,
  FaSoundcloud,
  FaSpotify,
  FaTwitch,
  FaYoutube,
} from "react-icons/fa";
import type { IconType } from "react-icons";
import { artist } from "@/content/artist";

const FEATURED_TRACK_URL =
  "https://soundcloud.com/elijahnang/ho-chi-minh-city-beat-255";

const coverSequence = [
  artist.images.artwork,
  artist.images.silhouette,
  artist.images.studio,
  artist.images.hero,
  artist.images.about,
  artist.images.artwork,
];

const platformIcons: Record<string, IconType> = {
  Spotify: FaSpotify,
  SoundCloud: FaSoundcloud,
  YouTube: FaYoutube,
  Instagram: FaInstagram,
  Twitch: FaTwitch,
  Facebook: FaFacebookF,
};

const linkGroups = [
  {
    title: "Listen",
    icon: FaHeadphones,
    links: artist.links.filter((link) =>
      ["Spotify", "SoundCloud"].includes(link.label),
    ),
  },
  {
    title: "Watch",
    icon: FaYoutube,
    links: artist.links.filter((link) => link.label === "YouTube"),
  },
  {
    title: "Follow",
    icon: FaMusic,
    links: artist.links.filter((link) =>
      ["Instagram", "Twitch", "Facebook"].includes(link.label),
    ),
  },
];

const archiveNotes = [
  "A defining entry point into Elijah's cinematic, East-Asian inspired sound.",
  "A continuation of the Gaijin world, shaped by atmosphere and story.",
  "A reflective album built around renewal, texture, and quiet movement.",
  "A dreamlike project with warmth, wonder, and a handmade sense of place.",
  "A beat tape that keeps the Nang Soul identity raw, rhythmic, and intimate.",
  "A foundational release for listeners tracing the archive back to its roots.",
];

export default function Home() {
  const featuredShelf = artist.featuredWorks.slice(0, 4);

  return (
    <article className="album-archive">
      <section className="archive-hero" id="overview">
        <div className="hero-copy reveal">
          <p className="section-label">Nang Soul Archive</p>
          <h1>{artist.name}</h1>
          <p className="hero-role">Producer / Composer / Audio Novelist</p>
          <p className="hero-years">{artist.years}</p>
          <p className="hero-summary">{artist.tagline}</p>
          <div className="hero-actions" aria-label="Primary actions">
            <a className="button-primary" href="#listen">
              Start Listening
            </a>
            <a className="button-secondary" href="#works">
              Explore Works
            </a>
          </div>
        </div>

        <div className="hero-portrait-wrap reveal delay-100">
          <Image
            src={artist.images.hero}
            alt={`Portrait of ${artist.name}`}
            fill
            preload
            sizes="(max-width: 900px) 86vw, 46vw"
            className="hero-portrait-image"
          />
          <div className="portrait-tag">
            <span>{artist.alias}</span>
            <strong>{artist.domain}</strong>
          </div>
        </div>
      </section>

      <section className="featured-shelf" aria-labelledby="featured-heading">
        <div className="shelf-header">
          <p id="featured-heading" className="section-label">
            Featured Projects
          </p>
          <a href="#works">Explore the catalog</a>
        </div>
        <div className="shelf-row reveal delay-200">
          {featuredShelf.map((work, index) => (
            <a
              key={work.title}
              href={work.listenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shelf-item"
            >
              <span className="shelf-cover">
                <Image
                  src={coverSequence[index]}
                  alt={`${work.title} archive artwork`}
                  fill
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  sizes="(max-width: 700px) 46vw, 23vw"
                  className="cover-image"
                />
              </span>
              <span className="shelf-title">{work.title}</span>
              <span className="shelf-meta">{work.type}</span>
            </a>
          ))}
        </div>
      </section>

      <section id="works" className="selected-works">
        <div className="section-heading">
          <p className="section-label">Selected Works</p>
          <h2>Records as worlds.</h2>
          <p>
            A curated path through projects that show Elijah&apos;s gift for turning
            instrumental music into story, place, and memory.
          </p>
        </div>

        <div className="work-list">
          {artist.featuredWorks.map((work, index) => (
            <article key={work.title} className="work-row">
              <div className="work-cover">
                <Image
                  src={coverSequence[index]}
                  alt={`${work.title} visual`}
                  fill
                  sizes="(max-width: 780px) 100vw, 16vw"
                  className="cover-image"
                />
              </div>
              <div className="work-main">
                <p>{work.type}</p>
                <h3>{work.title}</h3>
                <span>{archiveNotes[index] ?? work.description}</span>
              </div>
              <div className="work-platforms" aria-label={`${work.title} links`}>
                <span>
                  <FaSpotify aria-hidden="true" />
                  Spotify
                </span>
                <span>
                  <FaSoundcloud aria-hidden="true" />
                  SoundCloud
                </span>
                <span>
                  <FaYoutube aria-hidden="true" />
                  YouTube
                </span>
              </div>
              <a
                href={work.listenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="listen-button"
              >
                Listen
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="about-band">
        <div className="about-image">
          <Image
            src={artist.images.about}
            alt={`${artist.name} portrait`}
            fill
            sizes="(max-width: 850px) 100vw, 38vw"
            className="about-photo"
          />
        </div>
        <div className="about-copy">
          <p className="section-label">About</p>
          <h2>The sound, the spirit.</h2>
          <p>{artist.bio[0]}</p>
          <p>{artist.bio[1]}</p>
          <a href="#listen">Keep listening</a>
        </div>
      </section>

      <section id="listen" className="listening-band">
        <div className="listening-copy">
          <p className="section-label">Now Playing</p>
          <h2>A small listening room.</h2>
          <p>
            Start with a featured track, then move through the archive through
            the platform links below.
          </p>
        </div>
        <div className="listening-card">
          <div className="listening-card-art">
            <Image
              src={artist.images.artwork}
              alt=""
              fill
              sizes="(max-width: 850px) 35vw, 12rem"
              className="cover-image"
            />
          </div>
          <div className="listening-card-copy">
            <p>
              <FaSoundcloud aria-hidden="true" />
              Featured SoundCloud Track
            </p>
            <h3>Ho Chi Minh City Beat 255</h3>
            <span>
              A direct route into Elijah&apos;s catalog without breaking the
              archive mood.
            </span>
          </div>
          <a
            href={FEATURED_TRACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="listen-button"
          >
            <FaPlay aria-hidden="true" />
            Play Track
          </a>
        </div>
      </section>

      <section id="links" className="link-groups">
        {linkGroups.map((group) => {
          const GroupIcon = group.icon;

          return (
            <div key={group.title} className="link-group">
              <h2>
                <GroupIcon aria-hidden="true" />
                {group.title}
              </h2>
              <div>
                {group.links.map((link) => {
                  const LinkIcon = platformIcons[link.label] ?? FaMusic;

                  return (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>
                        <LinkIcon aria-hidden="true" />
                        {link.label}
                      </span>
                      <FaExternalLinkAlt aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      <section id="contact" className="contact-band" aria-labelledby="contact-heading">
        <div>
          <p className="section-label">Contact</p>
          <h2 id="contact-heading">A note on stewardship.</h2>
        </div>
        <div className="contact-copy">
          <p>
            This archive was made with respect, only to help preserve access to
            Elijah Nang&apos;s work and point listeners toward his official music
            pages. I am not selling anything here, and I do not want to profit
            from the site.
          </p>
          <p>
            If Elijah&apos;s family or loved ones would prefer to take
            stewardship of this archive, request changes, or have the site
            passed along to them, I would be grateful to hear from them.
          </p>
          <a href="mailto:chronosopher@proton.me">
            <FaEnvelope aria-hidden="true" />
            chronosopher@proton.me
          </a>
        </div>
      </section>

      <section className="memorial-footer-art" aria-label="Memorial closing">
        <Image
          src={artist.images.artwork}
          alt=""
          fill
          sizes="100vw"
          className="footer-art-image"
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
        <strong>{artist.alias}</strong>
      </footer>
    </article>
  );
}
