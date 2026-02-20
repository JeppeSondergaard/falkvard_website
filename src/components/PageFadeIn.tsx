"use client";

import { useEffect, useRef, useState } from "react";

export default function PageFadeIn() {
  const [fading, setFading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let done = false;
    const trigger = () => {
      if (done) return;
      done = true;
      setFading(true);
    };

    const MAX_WAIT = 6000;
    const timeout = setTimeout(trigger, MAX_WAIT);

    const images = Array.from(document.querySelectorAll("img"));
    const videos = Array.from(document.querySelectorAll("video"));

    let remaining = 0;

    const onLoad = () => {
      remaining--;
      if (remaining <= 0) trigger();
    };

    for (const img of images) {
      if (!img.complete) {
        remaining++;
        img.addEventListener("load", onLoad, { once: true });
        img.addEventListener("error", onLoad, { once: true });
      }
    }

    for (const vid of videos) {
      if (vid.readyState < 3) {
        remaining++;
        vid.addEventListener("canplaythrough", onLoad, { once: true });
        vid.addEventListener("error", onLoad, { once: true });
      }
    }

    if (remaining === 0) {
      requestAnimationFrame(() => requestAnimationFrame(trigger));
    }

    return () => {
      clearTimeout(timeout);
      done = true;
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#0a0a0e",
        pointerEvents: fading ? "none" : "all",
        opacity: fading ? 0 : 1,
        transition: "opacity 1.2s cubic-bezier(0.4,0,0.2,1)",
      }}
      onTransitionEnd={() => ref.current?.remove()}
    />
  );
}
