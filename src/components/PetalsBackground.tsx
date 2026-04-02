"use client";

import { useEffect, useRef } from "react";

const VIDEO_SRC =
  "https://res.cloudinary.com/dy3iiygyt/video/upload/v1775106170/Falling_cherry_blossom_petals._rtaiax.mp4";

export default function PetalsBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    function apply() {
      if (!videoRef.current) return;
      if (mq.matches) {
        videoRef.current.pause();
        videoRef.current.style.opacity = "0";
      } else {
        videoRef.current.play().catch(() => {});
        videoRef.current.style.opacity = "";
      }
    }

    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div
      className="absolute inset-0 z-[1] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Video layer */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-[0.12] sm:opacity-[0.14]"
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {/* Dark blend overlay to push petals further back */}
      <div className="absolute inset-0 bg-bg/60" />
    </div>
  );
}
