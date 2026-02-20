"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminNav from "@/components/AdminNav";
import s from "./stencils.module.scss";

type StencilRecord = {
  id: string;
  filename: string;
  original_name: string | null;
  src: string;
  enabled: number;
  sort_order: number;
  created_at: string;
};

function StencilCard({
  stencil,
  onToggle,
  onDelete,
}: {
  stencil: StencilRecord;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className={`${s.stencilCard} ${!stencil.enabled ? s.cardDisabled : ""}`}
    >
      <div
        className={s.stencilThumb}
        onClick={() => onToggle(stencil.id, !stencil.enabled)}
      >
        <Image
          src={stencil.src}
          alt={stencil.original_name || stencil.filename}
          width={220}
          height={220}
          unoptimized
          className={s.thumbImg}
        />
        {!stencil.enabled && <div className={s.disabledOverlay}>Skjult</div>}
      </div>

      <div className={s.stencilInfo}>
        <span
          className={s.stencilName}
          title={stencil.original_name || stencil.filename}
        >
          {stencil.original_name || stencil.filename}
        </span>

        <label
          className={`${s.checkboxLabel} ${
            stencil.enabled ? s.checked : s.unchecked
          }`}
        >
          <input
            type="checkbox"
            className={s.checkbox}
            checked={!!stencil.enabled}
            onChange={() => onToggle(stencil.id, !stencil.enabled)}
          />
          {stencil.enabled ? "Aktiv" : "Skjult"}
        </label>

        {!confirmDelete ? (
          <button
            type="button"
            className={s.deleteBtn}
            onClick={() => setConfirmDelete(true)}
            title="Slet stencil"
          >
            ✕
          </button>
        ) : (
          <button
            type="button"
            className={s.confirmDeleteBtn}
            onClick={() => onDelete(stencil.id)}
            onBlur={() => setTimeout(() => setConfirmDelete(false), 200)}
          >
            Slet?
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminStencilsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stencils, setStencils] = useState<StencilRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("fv-admin-token")
      : null;

  const authHeaders = useCallback(() => {
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const fetchStencils = useCallback(async () => {
    if (!token) {
      router.push("/admin");
      return;
    }

    const res = await fetch("/api/stencils", {
      headers: authHeaders(),
    });

    if (res.status === 401) {
      localStorage.removeItem("fv-admin-token");
      router.push("/admin");
      return;
    }

    const data = await res.json();
    setStencils(data);
    setLoading(false);
  }, [token, router, authHeaders]);

  useEffect(() => {
    fetchStencils();
  }, [fetchStencils]);

  async function toggleStencil(id: string, enabled: boolean) {
    await fetch(`/api/stencils/${id}`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setStencils((prev) =>
      prev.map((st) =>
        st.id === id ? { ...st, enabled: enabled ? 1 : 0 } : st
      )
    );
  }

  async function deleteStencil(id: string) {
    await fetch(`/api/stencils/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    setStencils((prev) => prev.filter((st) => st.id !== id));
  }

  async function uploadFiles(files: FileList | File[]) {
    if (!token) return;
    setUploading(true);

    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append("files", file);
    }

    await fetch("/api/stencils", {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });

    setUploading(false);
    fetchStencils();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  if (loading) {
    return (
      <>
        <AdminNav />
        <section className={s.section}>
          <p className={s.loading}>Indl&aelig;ser...</p>
        </section>
      </>
    );
  }

  const enabledCount = stencils.filter((st) => st.enabled).length;

  return (
    <>
      <AdminNav />
      <section className={s.section}>
        <div className={s.main}>
          <div className={s.header}>
            <div className={s.headerLeft}>
              <h1 className={s.pageTitle}>Stencils</h1>
              <span className={s.stencilCount}>
                {enabledCount} aktive / {stencils.length} total
              </span>
            </div>
            <button
              type="button"
              className={s.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploader..." : "Upload stencils"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/svg+xml,image/webp,image/gif,image/jpeg"
              className={s.fileInput}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  uploadFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
          </div>

          {/* Format guide */}
          <div className={s.guide}>
            <h2 className={s.guideTitle}>Filformat guide</h2>
            <p className={s.guideText}>
              Stencils vises som svævende, glødende designs i 3D-skoven. For
              bedste resultat:
            </p>
            <ul className={s.guideList}>
              <li>
                <span className={s.guideHighlight}>PNG med transparent baggrund</span>{" "}
                — anbefalet. Kun stencil-linjerne skal være synlige.
              </li>
              <li>
                <span className={s.guideHighlight}>Hvide eller lyse linjer</span>{" "}
                — stencils vises med additive blending, så lyse farver glødere
                bedst.
              </li>
              <li>
                <span className={s.guideHighlight}>Mindst 512×512 px</span>{" "}
                — for skarp visning i 3D-verdenen.
              </li>
              <li>
                SVG, WebP og JPEG understøttes også, men PNG med transparens giver det
                bedste resultat.
              </li>
              <li>
                Fineline-stil anbefales — tynde, detaljerede linjer ser bedst ud
                som glødende stencils.
              </li>
            </ul>
          </div>

          {/* Drop zone */}
          <div
            className={`${s.dropZone} ${dragOver ? s.dragOver : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className={s.dropZoneContent}>
              <span className={s.dropIcon}>↑</span>
              <span>Træk stencils hertil for at uploade</span>
            </div>
          </div>

          {/* Stencil grid */}
          {stencils.length === 0 ? (
            <div className={s.empty}>
              <p>Ingen stencils uploadet endnu.</p>
              <p className={s.emptyHint}>
                Upload PNG-filer med transparente stencil-designs.
              </p>
            </div>
          ) : (
            <div className={s.stencilGrid}>
              {stencils.map((stencil) => (
                <StencilCard
                  key={stencil.id}
                  stencil={stencil}
                  onToggle={toggleStencil}
                  onDelete={deleteStencil}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
