"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminNav from "@/components/AdminNav";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import s from "./images.module.scss";

type ImageRecord = {
  id: string;
  filename: string;
  original_name: string | null;
  src: string;
  folder: string;
  enabled: number;
  sort_order: number;
  alt_text: string | null;
  created_at: string;
};

const FOLDERS = [
  { id: "frontpage", label: "Forside", icon: "★" },
  { id: "nordisk", label: "Nordisk", icon: "ᛟ" },
  { id: "ornamental", label: "Ornamental", icon: "◈" },
  { id: "dark-art", label: "Dark Art", icon: "☽" },
  { id: "blomster", label: "Blomster", icon: "✿" },
  { id: "blackwork", label: "Blackwork", icon: "■" },
  { id: "fineline", label: "Fineline", icon: "╱" },
  { id: "unsorted", label: "Usorteret", icon: "…" },
];

function SortableImageCard({
  image,
  onToggle,
  onDelete,
  onMove,
  currentFolder,
}: {
  image: ImageRecord;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, folder: string) => void;
  currentFolder: string;
}) {
  const [showMove, setShowMove] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={s.imageCard}>
      <div className={s.dragHandle} {...attributes} {...listeners}>
        <span className={s.dragIcon}>⠿</span>
      </div>

      <div className={s.imageThumb}>
        <Image
          src={image.src}
          alt={image.alt_text || image.original_name || "Billede"}
          width={200}
          height={200}
          unoptimized
          className={s.thumbImg}
        />
        {!image.enabled && <div className={s.disabledOverlay}>Skjult</div>}
      </div>

      <div className={s.imageInfo}>
        <span className={s.imageName} title={image.original_name || image.filename}>
          {image.original_name || image.filename}
        </span>

        <div className={s.imageActions}>
          <button
            type="button"
            className={`${s.toggleBtn} ${image.enabled ? s.enabled : s.disabled}`}
            onClick={() => onToggle(image.id, !image.enabled)}
            title={image.enabled ? "Skjul billede" : "Vis billede"}
          >
            {image.enabled ? "Synlig" : "Skjult"}
          </button>

          <button
            type="button"
            className={s.moveBtn}
            onClick={() => setShowMove(!showMove)}
            title="Flyt til mappe"
          >
            ↗
          </button>

          {!confirmDelete ? (
            <button
              type="button"
              className={s.deleteBtn}
              onClick={() => setConfirmDelete(true)}
              title="Slet billede"
            >
              ✕
            </button>
          ) : (
            <button
              type="button"
              className={s.confirmDeleteBtn}
              onClick={() => onDelete(image.id)}
              onBlur={() => setTimeout(() => setConfirmDelete(false), 200)}
            >
              Slet?
            </button>
          )}
        </div>
      </div>

      {showMove && (
        <div className={s.moveMenu}>
          {FOLDERS.filter((f) => f.id !== currentFolder).map((f) => (
            <button
              key={f.id}
              type="button"
              className={s.moveMenuItem}
              onClick={() => {
                onMove(image.id, f.id);
                setShowMove(false);
              }}
            >
              <span className={s.moveMenuIcon}>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DragOverlayCard({ image }: { image: ImageRecord }) {
  return (
    <div className={`${s.imageCard} ${s.dragging}`}>
      <div className={s.imageThumb}>
        <Image
          src={image.src}
          alt={image.alt_text || "Billede"}
          width={200}
          height={200}
          unoptimized
          className={s.thumbImg}
        />
      </div>
      <div className={s.imageInfo}>
        <span className={s.imageName}>{image.original_name || image.filename}</span>
      </div>
    </div>
  );
}

export default function AdminImagesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImageRecord[]>([]);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [activeFolder, setActiveFolder] = useState("frontpage");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("fv-admin-token")
      : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const authHeaders = useCallback(() => {
    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const fetchImages = useCallback(async () => {
    if (!token) {
      router.push("/admin");
      return;
    }

    const res = await fetch(`/api/images?folder=${activeFolder}`, {
      headers: authHeaders(),
    });

    if (res.status === 401) {
      localStorage.removeItem("fv-admin-token");
      router.push("/admin");
      return;
    }

    const data = await res.json();
    setImages(data);
    setLoading(false);
  }, [token, activeFolder, router, authHeaders]);

  const fetchCounts = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/images", { headers: authHeaders() });
    if (!res.ok) return;
    const all: ImageRecord[] = await res.json();
    const counts: Record<string, number> = {};
    for (const f of FOLDERS) counts[f.id] = 0;
    for (const img of all) {
      counts[img.folder] = (counts[img.folder] || 0) + 1;
    }
    setFolderCounts(counts);
  }, [token, authHeaders]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  async function toggleImage(id: string, enabled: boolean) {
    await fetch(`/api/images/${id}`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, enabled: enabled ? 1 : 0 } : img))
    );
  }

  async function deleteImage(id: string) {
    await fetch(`/api/images/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    setImages((prev) => prev.filter((img) => img.id !== id));
    setFolderCounts((prev) => ({
      ...prev,
      [activeFolder]: Math.max(0, (prev[activeFolder] || 0) - 1),
    }));
  }

  async function moveImage(id: string, folder: string) {
    await fetch(`/api/images/${id}`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ folder }),
    });
    setImages((prev) => prev.filter((img) => img.id !== id));
    fetchCounts();
  }

  async function uploadFiles(files: FileList | File[]) {
    if (!token) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("folder", activeFolder);
    for (const file of Array.from(files)) {
      formData.append("files", file);
    }

    await fetch("/api/images", {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });

    setUploading(false);
    fetchImages();
    fetchCounts();
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

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(images, oldIndex, newIndex);
    setImages(reordered);

    const items = reordered.map((img, idx) => ({
      id: img.id,
      sort_order: idx,
    }));

    await fetch("/api/images/reorder", {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
  }

  const activeImage = activeId
    ? images.find((img) => img.id === activeId)
    : null;

  if (loading) {
    return (
      <>
        <AdminNav />
        <section className={s.section}>
          <p className={s.loading}>Indlæser...</p>
        </section>
      </>
    );
  }

  return (
    <>
      <AdminNav />
      <section className={s.section}>
        <div className={s.layout}>
          {/* Sidebar */}
          <aside className={s.sidebar}>
            <h2 className={s.sidebarTitle}>Mapper</h2>
            <div className={s.folderList}>
              {FOLDERS.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  className={`${s.folderItem} ${
                    activeFolder === folder.id ? s.active : ""
                  }`}
                  onClick={() => {
                    setActiveFolder(folder.id);
                    setLoading(true);
                  }}
                >
                  <span className={s.folderIcon}>{folder.icon}</span>
                  <span className={s.folderLabel}>{folder.label}</span>
                  <span className={s.folderCount}>
                    {folderCounts[folder.id] || 0}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <main className={s.main}>
            <div className={s.toolbar}>
              <div className={s.toolbarLeft}>
                <h1 className={s.pageTitle}>
                  {FOLDERS.find((f) => f.id === activeFolder)?.label || activeFolder}
                </h1>
                <span className={s.imageCount}>
                  {images.length} billede{images.length !== 1 ? "r" : ""}
                </span>
              </div>
              <button
                type="button"
                className={s.uploadBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploader..." : "Upload billeder"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                className={s.fileInput}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    uploadFiles(e.target.files);
                    e.target.value = "";
                  }
                }}
              />
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
                <span>Træk billeder hertil for at uploade</span>
              </div>
            </div>

            {/* Image grid */}
            {images.length === 0 ? (
              <div className={s.empty}>
                <p>Ingen billeder i denne mappe.</p>
                <p className={s.emptyHint}>
                  Upload billeder eller flyt dem fra en anden mappe.
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={images.map((img) => img.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className={s.imageGrid}>
                    {images.map((image) => (
                      <SortableImageCard
                        key={image.id}
                        image={image}
                        onToggle={toggleImage}
                        onDelete={deleteImage}
                        onMove={moveImage}
                        currentFolder={activeFolder}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeImage ? (
                    <DragOverlayCard image={activeImage} />
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </main>
        </div>
      </section>
    </>
  );
}
