"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminNav from "@/components/AdminNav";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  useDroppable,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
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

type FolderRecord = {
  id: string;
  label: string;
  icon: string;
  sort_order: number;
  show_in_gallery: number;
};

const PROTECTED_FOLDERS = ["frontpage", "unsorted"];

function SortableImageCard({
  image,
  folders,
  onToggle,
  onDelete,
  onMove,
  currentFolder,
}: {
  image: ImageRecord;
  folders: FolderRecord[];
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
          {folders.filter((f) => f.id !== currentFolder).map((f) => (
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

const FOLDER_DROP_PREFIX = "folder-drop-";

function DroppableFolder({
  folder,
  isActive,
  count,
  isOver,
  onClick,
  onDelete,
}: {
  folder: FolderRecord;
  isActive: boolean;
  count: number;
  isOver: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { setNodeRef } = useDroppable({
    id: `${FOLDER_DROP_PREFIX}${folder.id}`,
  });

  const isProtected = PROTECTED_FOLDERS.includes(folder.id);

  return (
    <div
      ref={setNodeRef}
      className={`${s.folderItem} ${isActive ? s.active : ""} ${isOver ? s.folderDropTarget : ""}`}
    >
      <button type="button" className={s.folderButton} onClick={onClick}>
        <span className={s.folderIcon}>{folder.icon}</span>
        <span className={s.folderLabel}>{folder.label}</span>
        <span className={s.folderCount}>{count}</span>
      </button>
      {!isProtected && onDelete && (
        <div className={s.folderActions}>
          {!confirmDelete ? (
            <button
              type="button"
              className={s.folderDeleteBtn}
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
              title="Slet mappe"
            >
              ✕
            </button>
          ) : (
            <button
              type="button"
              className={s.folderConfirmDeleteBtn}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              onBlur={() => setTimeout(() => setConfirmDelete(false), 200)}
            >
              Slet?
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminImagesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [activeFolder, setActiveFolder] = useState("frontpage");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderLabel, setNewFolderLabel] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("fv-admin-token")
      : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    const folderHit = pointerCollisions.find((c) =>
      String(c.id).startsWith(FOLDER_DROP_PREFIX)
    );
    if (folderHit) return [folderHit];
    return rectIntersection(args);
  }, []);

  const authHeaders = useCallback(() => {
    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const fetchFolders = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/folders", { headers: authHeaders() });
    if (!res.ok) return;
    const data: FolderRecord[] = await res.json();
    setFolders(data);
  }, [token, authHeaders]);

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
    for (const f of folders) counts[f.id] = 0;
    for (const img of all) {
      counts[img.folder] = (counts[img.folder] || 0) + 1;
    }
    setFolderCounts(counts);
  }, [token, authHeaders, folders]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    if (folders.length > 0) fetchCounts();
  }, [folders, fetchCounts]);

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

  async function addFolder() {
    if (!newFolderLabel.trim()) return;
    const id = newFolderLabel
      .toLowerCase()
      .replace(/[^a-zæøå0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        label: newFolderLabel.trim(),
        icon: newFolderIcon.trim() || "📁",
        show_in_gallery: true,
      }),
    });

    if (res.ok) {
      setNewFolderLabel("");
      setNewFolderIcon("");
      setShowAddFolder(false);
      fetchFolders();
    }
  }

  async function removeFolderById(folderId: string) {
    const res = await fetch(`/api/folders/${folderId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (res.ok) {
      if (activeFolder === folderId) {
        setActiveFolder("unsorted");
        setLoading(true);
      }
      fetchFolders();
      fetchCounts();
    }
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

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  function handleFileDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleFileDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id ? String(event.over.id) : null;
    if (overId?.startsWith(FOLDER_DROP_PREFIX)) {
      setDragOverFolder(overId.replace(FOLDER_DROP_PREFIX, ""));
    } else {
      setDragOverFolder(null);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const draggedId = activeId;
    setActiveId(null);
    setDragOverFolder(null);

    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);

    if (overId.startsWith(FOLDER_DROP_PREFIX)) {
      const targetFolder = overId.replace(FOLDER_DROP_PREFIX, "");
      if (targetFolder !== activeFolder && draggedId) {
        moveImage(draggedId, targetFolder);
      }
      return;
    }

    if (active.id === over.id) return;

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

  const activeFolderData = folders.find((f) => f.id === activeFolder);

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
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className={s.layout}>
            {/* Sidebar */}
            <aside className={s.sidebar}>
              <h2 className={s.sidebarTitle}>Mapper</h2>
              <div className={s.folderList}>
                {folders.map((folder) => (
                  <DroppableFolder
                    key={folder.id}
                    folder={folder}
                    isActive={activeFolder === folder.id}
                    count={folderCounts[folder.id] || 0}
                    isOver={dragOverFolder === folder.id && folder.id !== activeFolder}
                    onClick={() => {
                      setActiveFolder(folder.id);
                      setLoading(true);
                    }}
                    onDelete={() => removeFolderById(folder.id)}
                  />
                ))}
              </div>

              {/* Add folder */}
              <div className={s.addFolderSection}>
                {!showAddFolder ? (
                  <button
                    type="button"
                    className={s.addFolderToggle}
                    onClick={() => setShowAddFolder(true)}
                  >
                    + Ny mappe
                  </button>
                ) : (
                  <div className={s.addFolderForm}>
                    <input
                      type="text"
                      className={s.addFolderInput}
                      placeholder="Mappenavn"
                      value={newFolderLabel}
                      onChange={(e) => setNewFolderLabel(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addFolder()}
                      autoFocus
                    />
                    <input
                      type="text"
                      className={s.addFolderIconInput}
                      placeholder="Ikon"
                      value={newFolderIcon}
                      onChange={(e) => setNewFolderIcon(e.target.value)}
                      maxLength={2}
                    />
                    <div className={s.addFolderActions}>
                      <button
                        type="button"
                        className={s.addFolderSave}
                        onClick={addFolder}
                        disabled={!newFolderLabel.trim()}
                      >
                        Opret
                      </button>
                      <button
                        type="button"
                        className={s.addFolderCancel}
                        onClick={() => {
                          setShowAddFolder(false);
                          setNewFolderLabel("");
                          setNewFolderIcon("");
                        }}
                      >
                        Annuller
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Main content */}
            <main className={s.main}>
              <div className={s.toolbar}>
                <div className={s.toolbarLeft}>
                  <h1 className={s.pageTitle}>
                    {activeFolderData?.label || activeFolder}
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
                onDrop={handleFileDrop}
                onDragOver={handleFileDragOver}
                onDragLeave={handleFileDragLeave}
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
                <SortableContext
                  items={images.map((img) => img.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className={s.imageGrid}>
                    {images.map((image) => (
                      <SortableImageCard
                        key={image.id}
                        image={image}
                        folders={folders}
                        onToggle={toggleImage}
                        onDelete={deleteImage}
                        onMove={moveImage}
                        currentFolder={activeFolder}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </main>
          </div>

          <DragOverlay>
            {activeImage ? <DragOverlayCard image={activeImage} /> : null}
          </DragOverlay>
        </DndContext>
      </section>
    </>
  );
}
