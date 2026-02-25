"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { CONTENT_DEFAULTS } from "@/lib/content-defaults";
import s from "./content.module.scss";

type ContentDefaults = Record<
  string,
  { value: string; type: "text" | "image" | "json"; label: string; page: string; section: string }
>;

const PAGES = ["Om", "Forside", "Services", "Aftercare", "Kontakt", "Booking"];

export default function ContentPage() {
  const [content, setContent] = useState<Record<string, string>>({});
  const [defaults, setDefaults] = useState<ContentDefaults>({});
  const [activePage, setActivePage] = useState("Om");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState<Record<string, string>>({});
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("fv-admin-token")
      : null;

  const fetchContent = useCallback(async () => {
    if (!token) {
      router.push("/admin");
      return;
    }
    try {
      const res = await fetch("/api/site-content");
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      }
    } catch {
      // API unreachable — still show defaults
    }
    setLoading(false);
  }, [token, router]);

  useEffect(() => {
    const defs: ContentDefaults = {};
    for (const [key, def] of Object.entries(CONTENT_DEFAULTS)) {
      defs[key] = def;
    }
    setDefaults(defs);
    fetchContent();
  }, [fetchContent]);

  function handleChange(key: string, value: string) {
    setDirty((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function getValue(key: string): string {
    if (key in dirty) return dirty[key];
    if (key in content) return content[key];
    return defaults[key]?.value ?? "";
  }

  async function handleSave() {
    if (!token || Object.keys(dirty).length === 0) return;
    setSaving(true);
    const textEntries: Record<string, string> = {};
    for (const [key, value] of Object.entries(dirty)) {
      if (defaults[key]?.type !== "image") {
        textEntries[key] = value;
      }
    }

    if (Object.keys(textEntries).length > 0) {
      await fetch("/api/site-content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(textEntries),
      });
    }

    setContent((prev) => ({ ...prev, ...dirty }));
    setDirty({});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleImageUpload(key: string, file: File) {
    if (!token) return;
    setUploadingKey(key);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("key", key);

    const res = await fetch("/api/site-content", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      setContent((prev) => ({ ...prev, [key]: data.src }));
      setDirty((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    setUploadingKey(null);
  }

  function getPageSections(): Record<string, string[]> {
    const sections: Record<string, string[]> = {};
    for (const [key, def] of Object.entries(defaults)) {
      if (def.page !== activePage) continue;
      if (!sections[def.section]) sections[def.section] = [];
      sections[def.section].push(key);
    }
    return sections;
  }

  function renderField(key: string) {
    const def = defaults[key];
    if (!def) return null;

    if (def.type === "image") {
      const currentSrc = getValue(key);
      return (
        <div key={key} className={s.fieldCard}>
          <span className={s.fieldLabel}>
            {def.label}
            <span className={s.fieldKey}>{key}</span>
          </span>
          <div className={s.imageField}>
            <div className={s.imagePreview}>
              {currentSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentSrc} alt={def.label} />
              ) : (
                <span className={s.imagePlaceholder}>Intet billede</span>
              )}
            </div>
            <div className={s.imageControls}>
              <button
                type="button"
                className={s.uploadBtn}
                onClick={() => {
                  setUploadingKey(key);
                  fileInputRef.current?.click();
                }}
                disabled={uploadingKey === key}
              >
                {uploadingKey === key ? "Uploader..." : "Vælg nyt billede"}
              </button>
              <span className={s.uploadHint}>
                JPG, PNG eller WebP. Maks 10 MB.
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (def.type === "json") {
      return renderJsonField(key, def);
    }

    const val = getValue(key);
    const isLong = val.length > 100 || val.includes("\n");

    return (
      <div key={key} className={s.fieldCard}>
        <label className={s.fieldLabel}>
          {def.label}
          <span className={s.fieldKey}>{key}</span>
        </label>
        {isLong ? (
          <textarea
            className={s.textarea}
            value={val}
            onChange={(e) => handleChange(key, e.target.value)}
            rows={Math.min(8, Math.max(3, val.split("\n").length + 1))}
          />
        ) : (
          <input
            type="text"
            className={s.textInput}
            value={val}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        )}
      </div>
    );
  }

  function renderJsonField(
    key: string,
    def: { label: string }
  ) {
    const raw = getValue(key);
    let items: unknown[];
    try {
      items = JSON.parse(raw);
    } catch {
      items = [];
    }

    const isStringArray =
      items.length === 0 ||
      typeof items[0] === "string";
    const isFaqLike =
      !isStringArray &&
      items.length > 0 &&
      typeof items[0] === "object" &&
      items[0] !== null &&
      "q" in items[0];

    function updateItems(next: unknown[]) {
      handleChange(key, JSON.stringify(next));
    }

    if (isStringArray) {
      const strings = items as string[];
      return (
        <div key={key} className={s.fieldCard}>
          <span className={s.fieldLabel}>
            {def.label}
            <span className={s.fieldKey}>{key}</span>
          </span>
          <div className={s.jsonEditor}>
            {strings.map((item, i) => (
              <div key={i} className={s.jsonItemRow}>
                <span style={{ color: "var(--text-muted)", fontSize: "12px", minWidth: 24 }}>
                  {i + 1}.
                </span>
                <input
                  type="text"
                  className={s.jsonItemInput}
                  value={item}
                  onChange={(e) => {
                    const next = [...strings];
                    next[i] = e.target.value;
                    updateItems(next);
                  }}
                />
                <button
                  type="button"
                  className={s.removeBtn}
                  onClick={() => updateItems(strings.filter((_, j) => j !== i))}
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              type="button"
              className={s.addBtn}
              onClick={() => updateItems([...strings, ""])}
            >
              + Tilføj
            </button>
          </div>
        </div>
      );
    }

    if (isFaqLike) {
      const faqs = items as { q: string; a: string }[];
      return (
        <div key={key} className={s.fieldCard}>
          <span className={s.fieldLabel}>
            {def.label}
            <span className={s.fieldKey}>{key}</span>
          </span>
          <div className={s.jsonEditor}>
            {faqs.map((item, i) => (
              <div key={i} className={s.jsonItem}>
                <div className={s.jsonItemRow}>
                  <span style={{ color: "var(--text-muted)", fontSize: "12px", minWidth: 24 }}>
                    Q:
                  </span>
                  <input
                    type="text"
                    className={s.jsonItemInput}
                    value={item.q}
                    onChange={(e) => {
                      const next = [...faqs];
                      next[i] = { ...next[i], q: e.target.value };
                      updateItems(next);
                    }}
                  />
                  <button
                    type="button"
                    className={s.removeBtn}
                    onClick={() => updateItems(faqs.filter((_, j) => j !== i))}
                  >
                    &times;
                  </button>
                </div>
                <div className={s.jsonItemRow}>
                  <span style={{ color: "var(--text-muted)", fontSize: "12px", minWidth: 24 }}>
                    A:
                  </span>
                  <textarea
                    className={s.jsonItemTextarea}
                    value={item.a}
                    onChange={(e) => {
                      const next = [...faqs];
                      next[i] = { ...next[i], a: e.target.value };
                      updateItems(next);
                    }}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              className={s.addBtn}
              onClick={() => updateItems([...faqs, { q: "", a: "" }])}
            >
              + Tilføj spørgsmål
            </button>
          </div>
        </div>
      );
    }

    // Generic object array (process steps)
    const objs = items as { title: string; text: string }[];
    return (
      <div key={key} className={s.fieldCard}>
        <span className={s.fieldLabel}>
          {def.label}
          <span className={s.fieldKey}>{key}</span>
        </span>
        <div className={s.jsonEditor}>
          {objs.map((item, i) => (
            <div key={i} className={s.jsonItem}>
              <div className={s.jsonItemRow}>
                <span style={{ color: "var(--text-muted)", fontSize: "12px", minWidth: 24 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <input
                  type="text"
                  className={s.jsonItemInput}
                  value={item.title}
                  placeholder="Titel"
                  onChange={(e) => {
                    const next = [...objs];
                    next[i] = { ...next[i], title: e.target.value };
                    updateItems(next);
                  }}
                />
                <button
                  type="button"
                  className={s.removeBtn}
                  onClick={() => updateItems(objs.filter((_, j) => j !== i))}
                >
                  &times;
                </button>
              </div>
              <div className={s.jsonItemRow}>
                <span style={{ minWidth: 24 }} />
                <textarea
                  className={s.jsonItemTextarea}
                  value={item.text}
                  placeholder="Tekst"
                  onChange={(e) => {
                    const next = [...objs];
                    next[i] = { ...next[i], text: e.target.value };
                    updateItems(next);
                  }}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            className={s.addBtn}
            onClick={() => updateItems([...objs, { title: "", text: "" }])}
          >
            + Tilføj trin
          </button>
        </div>
      </div>
    );
  }

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

  const sections = getPageSections();
  const hasDirty = Object.keys(dirty).length > 0;

  return (
    <>
      <AdminNav />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className={s.hiddenInput}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingKey) {
            handleImageUpload(uploadingKey, file);
          }
          e.target.value = "";
        }}
      />
      <section className={s.section}>
        <div className={s.inner}>
          <div className={s.header}>
            <h1 className={s.title}>Indhold</h1>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {saved && <span className={s.saveFeedback}>Gemt!</span>}
              <button
                type="button"
                className={s.saveBtn}
                onClick={handleSave}
                disabled={saving || !hasDirty}
              >
                {saving ? "Gemmer..." : "Gem ændringer"}
              </button>
            </div>
          </div>

          <div className={s.pageTabs}>
            {PAGES.map((page) => (
              <button
                key={page}
                type="button"
                className={`${s.pageTab} ${activePage === page ? s.active : ""}`}
                onClick={() => setActivePage(page)}
              >
                {page}
              </button>
            ))}
          </div>

          {Object.entries(sections).map(([sectionName, keys]) => (
            <div key={sectionName} className={s.sectionGroup}>
              <h2 className={s.sectionTitle}>{sectionName}</h2>
              <div className={s.fieldList}>
                {keys.map((key) => renderField(key))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
