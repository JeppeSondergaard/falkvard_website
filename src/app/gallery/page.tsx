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

type FolderRecord = {
  id: string;
  label: string;
  icon: string;
  sort_order: number;
  show_in_gallery: number;
};

export default function GalleryPage() {
  const [allImages, setAllImages] = useState<GalleryImage[]>([]);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("Alle");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/images/public?location=gallery").then((r) => r.json()),
      fetch("/api/folders?scope=gallery").then((r) => r.json()),
    ])
      .then(([images, foldersData]) => {
        setAllImages(images);
        setFolders(foldersData);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const filtered =
    activeFilter === "Alle"
      ? allImages
      : allImages.filter((p) => p.folder === activeFilter);

  const folderLabel = (id: string) =>
    folders.find((f) => f.id === id)?.label || id;

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
          <button
            type="button"
            className={`${s.filterPill} ${activeFilter === "Alle" ? s.active : ""}`}
            onClick={() => setActiveFilter("Alle")}
          >
            Alle
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className={`${s.filterPill} ${activeFilter === folder.id ? s.active : ""}`}
              onClick={() => setActiveFilter(folder.id)}
            >
              {folder.label}
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
                      {folderLabel(img.folder)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className={s.count}>
            Viser {filtered.length} tatoveringer
            {activeFilter !== "Alle" && ` i kategorien "${folderLabel(activeFilter)}"`}
          </p>
        </div>
      </section>
    </>
  );
}
