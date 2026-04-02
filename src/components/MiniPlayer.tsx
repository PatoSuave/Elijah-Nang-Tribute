"use client";

import { useEffect, useState } from "react";

const SOUNDCLOUD_URL =
  "https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/elijahnang/ho-chi-minh-city-beat-255&color=%23c28a36&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false";

export default function MiniPlayer() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={`
        fixed z-40 transition-all duration-700 ease-out
        bottom-4 right-4
        sm:bottom-6 sm:right-6
        left-4 sm:left-auto
        sm:w-[320px]
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}
      `}
      role="complementary"
      aria-label="Music player"
    >
      <div className="relative bg-surface/90 backdrop-blur-md border border-border rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
          <span className="text-[10px] tracking-[0.2em] uppercase text-accent-muted font-medium">
            Now Playing
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="text-text-dim hover:text-text-muted transition-colors duration-200 text-xs leading-none p-1 -mr-1"
            aria-label="Dismiss player"
          >
            &#x2715;
          </button>
        </div>

        {/* SoundCloud embed */}
        <div className="h-[80px]">
          <iframe
            title="Elijah Nang on SoundCloud"
            width="100%"
            height="80"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={SOUNDCLOUD_URL}
          />
        </div>
      </div>
    </div>
  );
}
