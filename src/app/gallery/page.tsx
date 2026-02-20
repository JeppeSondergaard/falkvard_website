"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import s from "./page.module.scss";

type GalleryImage = {
  id: string;
  src: string;
  folder: string;
  alt_text: string | null;
  original_name: string | null;
};

const STYLES = ["Alle", "nordisk", "ornamental", "dark-art", "blomster", "blackwork", "fineline", "unsorted"] as const;
const STYLE_LABELS: Record<string, string> = {
  Alle: "Alle",
  nordisk: "Nordisk",
  ornamental: "Ornamental",
  "dark-art": "Dark Art",
  blomster: "Blomster",
  blackwork: "Blackwork",
  fineline: "Fineline",
  unsorted: "Andet",
};

export default function GalleryPage() {
  const [allImages, setAllImages] = useState<GalleryImage[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("Alle");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/images/public?location=gallery")
      .then((r) => r.json())
      .then((data) => {
        setAllImages(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const filtered =
    activeFilter === "Alle"
      ? allImages
      : allImages.filter((p) => p.folder === activeFilter);

  return (
    <>
      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1 className={s.heroHeading}>Galleri</h1>
          <p className={s.heroIntro}>Udforsk vores seneste arbejde</p>
        </div>
      </section>

      <div className={s.filterBar}>
        <div className={s.filterInner}>
          {STYLES.map((style) => (
            <button
              key={style}
              type="button"
              className={`${s.filterPill} ${activeFilter === style ? s.active : ""}`}
              onClick={() => setActiveFilter(style)}
            >
              {STYLE_LABELS[style]}
            </button>
          ))}
        </div>
      </div>

      <section className={s.gallerySection}>
        <div className={s.galleryInner}>
          {!loaded ? (
            <p className={s.emptyState}>Indlæser...</p>
          ) : filtered.length === 0 ? (
            <p className={s.emptyState}>
              Ingen billeder i denne kategori endnu.
            </p>
          ) : (
            <div className={s.masonryGrid}>
              {filtered.map((img) => (
                <div key={img.id} className={s.galleryItem}>
                  <Image
                    src={img.src}
                    alt={img.alt_text || "Tatovering"}
                    width={640}
                    height={640}
                    unoptimized
                    className={s.galleryImage}
                  />
                  <div className={s.galleryOverlay}>
                    <span className={s.galleryStyle}>
                      {STYLE_LABELS[img.folder] || img.folder}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className={s.count}>
            Viser {filtered.length} tatoveringer
            {activeFilter !== "Alle" && ` i kategorien "${STYLE_LABELS[activeFilter]}"`}
          </p>
        </div>
      </section>
    </>
  );
}
