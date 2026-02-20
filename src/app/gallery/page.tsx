"use client";

import { useState } from "react";
import Image from "next/image";
import s from "./page.module.scss";
import galleryData from "@/data/instagram-posts.json";

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
  const [activeFilter, setActiveFilter] = useState<string>("Alle");

  const filtered =
    activeFilter === "Alle"
      ? galleryData
      : galleryData.filter((p) => p.style === activeFilter);

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
          {filtered.length === 0 ? (
            <p className={s.emptyState}>
              Ingen billeder i denne kategori endnu.
            </p>
          ) : (
            <div className={s.masonryGrid}>
              {filtered.map((post) => (
                <div key={post.shortcode} className={s.galleryItem}>
                  <Image
                    src={post.src}
                    alt={post.caption ? post.caption.split("\n")[0].substring(0, 80) : "Tatovering"}
                    width={640}
                    height={640}
                    unoptimized
                    className={s.galleryImage}
                  />
                  <div className={s.galleryOverlay}>
                    <span className={s.galleryStyle}>
                      {STYLE_LABELS[post.style] || post.style}
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

          <p className={s.note}>
            Du kan hj&aelig;lpe med at sortere billeder i de rigtige kategorier
            ved at flytte dem mellem mapperne i{" "}
            <code>public/gallery/</code>
          </p>
        </div>
      </section>
    </>
  );
}
