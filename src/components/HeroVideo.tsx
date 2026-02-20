"use client";

import { useRef, useEffect } from "react";

interface HeroVideoProps {
  className?: string;
}

export default function HeroVideo({ className }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

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
