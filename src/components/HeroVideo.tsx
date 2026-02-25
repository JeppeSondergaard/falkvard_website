"use client";

import { useRef, useEffect, useState } from "react";

interface HeroVideoProps {
  className?: string;
}

export default function HeroVideo({ className }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOk, setVideoOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/hero-bg-720.mp4", { method: "HEAD" })
      .then((res) => {
        if (!cancelled && res.ok) setVideoOk(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!videoOk) return;
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, [videoOk]);

  if (!videoOk) {
    return (
      <div
        className={className}
        style={{ backgroundImage: "url(/hero-bg-poster.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      poster="/hero-bg-poster.jpg"
      preload="auto"
    >
      <source src="/hero-bg-720.mp4" type="video/mp4" />
    </video>
  );
}
