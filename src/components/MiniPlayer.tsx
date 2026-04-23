"use client";

import { useEffect, useState } from "react";

const SOUNDCLOUD_URL =
  "https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/elijahnang/ho-chi-minh-city-beat-255&color=%23c28a36&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false";

export default function MiniPlayer() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={`
        fixed z-40 transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)
        bottom-6 right-6
        left-6 sm:left-auto
        sm:w-[340px]
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"}
      `}
      role="complementary"
      aria-label="Music player"
    >
      <div className="relative bg-surface/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1">
              <span className="w-0.5 h-3 bg-accent animate-[pulse_1s_ease-in-out_infinite]" />
              <span className="w-0.5 h-3 bg-accent animate-[pulse_1s_ease-in-out_infinite_0.2s]" />
              <span className="w-0.5 h-3 bg-accent animate-[pulse_1s_ease-in-out_infinite_0.4s]" />
            </div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-accent/80 font-semibold">
              Archive Audio
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-text-dim hover:text-text-muted transition-colors duration-200 text-xs leading-none p-1.5 rounded-full hover:bg-white/5"
            aria-label="Dismiss player"
          >
            &#x2715;
          </button>
        </div>

        {/* SoundCloud embed */}
        <div className="h-[80px] bg-black/20">
          <iframe
            title="Elijah Nang on SoundCloud"
            width="100%"
            height="80"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            loading="lazy"
            src={SOUNDCLOUD_URL}
            className="grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
          />
        </div>
      </div>
    </div>
  );
}
