import Image from "next/image";
import s from "./styleguide.module.scss";
import TentIcon from "@/components/TentIcon";

const colors = [
  { name: "bg-primary", value: "#0A0A0A", var: "--bg-primary" },
  { name: "bg-secondary", value: "#141414", var: "--bg-secondary" },
  { name: "bg-elevated", value: "#1E1E1E", var: "--bg-elevated" },
  { name: "bg-surface", value: "#262626", var: "--bg-surface" },
  { name: "text-primary", value: "#FFFFFF", var: "--text-primary" },
  { name: "text-secondary", value: "#A0A0A0", var: "--text-secondary" },
  { name: "text-muted", value: "#666666", var: "--text-muted" },
  { name: "accent", value: "#CCCCCC", var: "--accent" },
  { name: "accent-hover", value: "#FFFFFF", var: "--accent-hover" },
  { name: "border", value: "#2A2A2A", var: "--border" },
  { name: "ornamental", value: "#888888", var: "--ornamental" },
];

export default function StyleguidePage() {
  return (
    <div className={s.page}>
      {/* Header */}
      <header className={s.header}>
        <div className={s.headerInner}>
          <div className={s.logo}>
            <TentIcon size={24} variant="white" />
            Falkvard Tattoo
          </div>
        </div>
      </header>

      {/* ========== 01. LOGO & BRAND ========== */}
      <section className={s.section}>
        <p className={s.sectionLabel}>01 — Logo & Brand</p>
        <h2 className={s.sectionTitle}>Logo</h2>
        <p className={s.sectionDescription}>
          The tent icon is the primary brand mark, sourced directly from
          FV_logo.png. White variant for dark backgrounds, dark for light.
        </p>

        <h3 className={s.sectionLabel} style={{ marginBottom: 16 }}>
          Full Logo
        </h3>
        <div className={s.logoGrid}>
          <div className={`${s.logoCard} ${s.logoCardDark}`}>
            <TentIcon size={80} variant="white" />
            <div style={{ marginTop: 12, textAlign: "center", color: "#ffffff", fontWeight: 400, fontSize: "1.8rem", letterSpacing: "0.08em" }}>
              Falkvard
            </div>
            <div style={{ textAlign: "center", color: "#ffffff", fontWeight: 400, fontSize: "1.8rem", letterSpacing: "0.08em" }}>
              Tattoo
            </div>
            <span className={s.logoCardLabel} style={{ color: "#666" }}>On dark</span>
          </div>
          <div className={`${s.logoCard} ${s.logoCardLight}`}>
            <TentIcon size={80} variant="dark" />
            <div style={{ marginTop: 12, textAlign: "center", color: "#111111", fontWeight: 400, fontSize: "1.8rem", letterSpacing: "0.08em" }}>
              Falkvard
            </div>
            <div style={{ textAlign: "center", color: "#111111", fontWeight: 400, fontSize: "1.8rem", letterSpacing: "0.08em" }}>
              Tattoo
            </div>
            <span className={s.logoCardLabel}>On light</span>
          </div>
          <div className={`${s.logoCard} ${s.logoCardTransparent}`}>
            <TentIcon size={80} variant="dark" />
            <div style={{ marginTop: 12, textAlign: "center", fontWeight: 400, fontSize: "1.8rem", letterSpacing: "0.08em" }}>
              Falkvard
            </div>
            <div style={{ textAlign: "center", fontWeight: 400, fontSize: "1.8rem", letterSpacing: "0.08em" }}>
              Tattoo
            </div>
            <span className={s.logoCardLabel}>Transparent</span>
          </div>
        </div>

        <h3 className={s.sectionLabel} style={{ marginTop: 48, marginBottom: 16 }}>
          Tent Icon — Sizes
        </h3>
        <div className={s.tentIconDemo}>
          {[16, 24, 32, 48, 64, 96, 128].map((sz) => (
            <div key={sz} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <TentIcon size={sz} />
              <span className={s.tentSizeLabel}>{sz}px</span>
            </div>
          ))}
        </div>

        <h3 className={s.sectionLabel} style={{ marginTop: 48, marginBottom: 16 }}>
          Tent as Design Element
        </h3>
        <div className={s.tentDesignElements}>
          <div className={s.tentDivider}>
            <TentIcon size={20} />
          </div>

          <div className={s.tentWatermark}>
            <TentIcon size={250} className={s.tentWatermarkIcon} />
            <p className={s.tentWatermarkText}>
              Watermark / background element
            </p>
          </div>

          <div className={s.tentCorner}>
            <TentIcon size={28} className={s.tentCornerIcon} />
            <TentIcon size={28} className={s.tentCornerIcon} />
            <TentIcon size={28} className={s.tentCornerIcon} />
            <TentIcon size={28} className={s.tentCornerIcon} />
            <p className={s.tentWatermarkText} style={{ fontSize: "1.2rem" }}>
              Corner accent pattern
            </p>
          </div>
        </div>

        <h3 className={s.sectionLabel} style={{ marginTop: 48, marginBottom: 16 }}>
          Favicons
        </h3>
        <div className={s.faviconGrid}>
          {[16, 32, 48, 96, 180, 192].map((sz) => (
            <div key={sz} className={s.faviconItem}>
              <Image
                src={`/favicon-${sz}x${sz}.png`}
                alt={`Favicon ${sz}x${sz}`}
                width={Math.min(sz, 96)}
                height={Math.min(sz, 96)}
                unoptimized
              />
              <span className={s.faviconLabel}>{sz}×{sz}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ========== 2. COLOR PALETTE ========== */}
      <section className={s.section}>
        <p className={s.sectionLabel}>02 — Colors</p>
        <h2 className={s.sectionTitle}>Color Palette</h2>
        <p className={s.sectionDescription}>
          Pure greyscale. No warm tones, no gold. Dark theme is default.
        </p>

        <div className={s.colorGrid}>
          {colors.map((c) => (
            <div key={c.name} className={s.colorSwatch}>
              <div className={s.swatchColor} style={{ background: c.value }} />
              <div className={s.swatchInfo}>
                <div className={s.swatchName}>{c.name}</div>
                <div className={s.swatchValue}>{c.value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== 2. TYPOGRAPHY ========== */}
      <section className={s.section}>
        <p className={s.sectionLabel}>03 — Typography</p>
        <h2 className={s.sectionTitle}>Type Scale</h2>
        <p className={s.sectionDescription}>
          Single font: CourierNewPMST. Typewriter monospace across all text.
        </p>

        <div className={s.typeStack}>
          <div className={s.typeSample}>
            <span className={s.typeLabel}>H1 — 60px / Bold</span>
            <h1 className={s.typeDemo}>Tatoveringer med sjæl</h1>
            <span className={s.typeMeta}>
              CourierNewPMST · weight: 700 · line-height: 1.15
            </span>
          </div>

          <div className={s.typeSample}>
            <span className={s.typeLabel}>H2 — 40px / Bold</span>
            <h2 className={s.typeDemo}>Nordisk, Ornamental, Dark Art</h2>
            <span className={s.typeMeta}>
              CourierNewPMST · weight: 700 · line-height: 1.15
            </span>
          </div>

          <div className={s.typeSample}>
            <span className={s.typeLabel}>H3 — 32px / Bold</span>
            <h3 className={s.typeDemo}>Privat studie i Svendborg</h3>
            <span className={s.typeMeta}>
              CourierNewPMST · weight: 700 · line-height: 1.15
            </span>
          </div>

          <div className={s.typeSample}>
            <span className={s.typeLabel}>H4 — 24px / Bold</span>
            <h4 className={s.typeDemo}>Book din næste session</h4>
            <span className={s.typeMeta}>
              CourierNewPMST · weight: 700 · line-height: 1.15
            </span>
          </div>

          <div className={s.typeSample}>
            <span className={s.typeLabel}>Body — 16px / Regular</span>
            <p className={s.typeDemo}>
              I mit private studie er kunden altid i centrum. Det vigtigste for
              mig er, at du føler dig tryg, hørt og set gennem hele processen.
              Jeg er her for at hjælpe dig med at finde det rette design, der
              passer til dig.
            </p>
            <span className={s.typeMeta}>
              CourierNewPMST · weight: 400 · line-height: 1.65
            </span>
          </div>

          <div className={s.typeSample}>
            <span className={s.typeLabel}>Small — 14px / Regular</span>
            <p className={s.typeDemo} style={{ fontSize: "0.875rem" }}>
              Ramsherred 1, Svendborg 5700 · Åbent efter aftale
            </p>
            <span className={s.typeMeta}>
              CourierNewPMST · weight: 400 · line-height: 1.65
            </span>
          </div>

          <div className={s.typeSample}>
            <span className={s.typeLabel}>Section Label — 12px / Bold / Uppercase</span>
            <p className={s.sectionLabelDemo}>The Story</p>
            <span className={s.typeMeta}>
              uppercase · letter-spacing: 0.15em · 12px
            </span>
          </div>
        </div>
      </section>

      {/* ========== DECORATIVE DISPLAY TEXT ========== */}
      <div className={s.displayText}>sjæl</div>

      {/* ========== 3. BUTTONS ========== */}
      <section className={s.section}>
        <p className={s.sectionLabel}>04 — Buttons</p>
        <h2 className={s.sectionTitle}>Button Styles</h2>

        <div className={s.buttonGroup}>
          <div>
            <p className={s.sectionLabel} style={{ marginBottom: 12 }}>
              Primary
            </p>
            <div className={s.buttonRow}>
              <button className={`${s.btn} ${s.btnPrimary} ${s.btnSm}`}>
                Small
              </button>
              <button className={`${s.btn} ${s.btnPrimary} ${s.btnMd}`}>
                Book en tid
              </button>
              <button className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>
                Se galleri
              </button>
              <button
                className={`${s.btn} ${s.btnPrimary} ${s.btnMd}`}
                disabled
              >
                Disabled
              </button>
            </div>
          </div>

          <div>
            <p className={s.sectionLabel} style={{ marginBottom: 12 }}>
              Secondary / Outline
            </p>
            <div className={s.buttonRow}>
              <button className={`${s.btn} ${s.btnSecondary} ${s.btnSm}`}>
                Small
              </button>
              <button className={`${s.btn} ${s.btnSecondary} ${s.btnMd}`}>
                Kontakt os
              </button>
              <button className={`${s.btn} ${s.btnSecondary} ${s.btnLg}`}>
                Læs mere
              </button>
              <button
                className={`${s.btn} ${s.btnSecondary} ${s.btnMd}`}
                disabled
              >
                Disabled
              </button>
            </div>
          </div>

          <div>
            <p className={s.sectionLabel} style={{ marginBottom: 12 }}>
              Ghost / Text Link
            </p>
            <div className={s.buttonRow}>
              <button className={`${s.btn} ${s.btnGhost} ${s.btnMd}`}>
                Læs hele historien
              </button>
              <button className={`${s.btn} ${s.btnGhost} ${s.btnMd}`}>
                Se mere
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 4. CARDS ========== */}
      <section className={s.section}>
        <p className={s.sectionLabel}>05 — Cards</p>
        <h2 className={s.sectionTitle}>Card Variants</h2>

        <div className={s.cardGrid}>
          <div className={s.card}>
            <h4 className={s.cardTitle}>Standard Card</h4>
            <p className={s.cardText}>
              Elevated background with subtle border. Lifts on hover with accent
              border glow.
            </p>
          </div>

          <div className={s.cardAccent}>
            <h4 className={s.cardTitle}>Accent Card</h4>
            <p className={s.cardText}>
              Left accent border. Used for highlighting key information
              or features.
            </p>
          </div>

          <div className={s.cardDark}>
            <h4 className={s.cardTitle} style={{ position: "relative" }}>
              Dark Card
            </h4>
            <p className={s.cardText} style={{ position: "relative" }}>
              Charcoal background with subtle grid overlay pattern. For
              atmospheric sections.
            </p>
          </div>

          <div className={s.cardGhost}>
            <h4 className={s.cardTitle}>Ghost Card</h4>
            <p className={s.cardText}>
              Transparent with dashed border. Light, sketch-like feel for
              secondary content.
            </p>
          </div>
        </div>
      </section>

      {/* ========== 5. ORNAMENTAL ELEMENTS ========== */}
      <section className={s.section}>
        <p className={s.sectionLabel}>06 — Ornamental</p>
        <h2 className={s.sectionTitle}>Decorative Elements</h2>

        <p className={s.sectionDescription}>
          Victorian/gothic inspired ornamental frames and dividers. Used
          sparingly for emphasis.
        </p>

        <div className={s.ornamentalFrame}>
          <h4 className={s.cardTitle}>Ornamental Frame</h4>
          <p className={s.cardText}>
            Corner brackets inspired by Victorian decorative borders. Used for
            pull quotes, featured content, and special callouts.
          </p>
        </div>

        <div className={s.ornamentalDivider}>
          <span>✦</span>
        </div>

        <div className={s.ornamentalDivider}>
          <TentIcon size={20} />
        </div>

        <div className={s.ornamentalDivider}>
          <span>Falkvard</span>
        </div>
      </section>

      {/* ========== 6. SECTION LABELS ========== */}
      <section className={s.section}>
        <p className={s.sectionLabel}>07 — Section Labels</p>
        <h2 className={s.sectionTitle}>Section Headers</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          <div>
            <p className={s.sectionLabelDemo}>The Story</p>
            <h2 className={s.sectionLabelHeading}>
              En tatovør fra Svendborg med sjæl i nålen
            </h2>
          </div>
          <div>
            <p className={s.sectionLabelDemo}>Featured Work</p>
            <h2 className={s.sectionLabelHeading}>Udvalgt arbejde</h2>
          </div>
          <div>
            <p className={s.sectionLabelDemo}>How to Book</p>
            <h2 className={s.sectionLabelHeading}>Sådan booker du</h2>
          </div>
        </div>
      </section>

      {/* ========== 7. PULL QUOTE ========== */}
      <section className={s.section}>
        <p className={s.sectionLabel}>08 — Pull Quote</p>
        <h2 className={s.sectionTitle}>Decorative Quotes</h2>

        <div className={s.pullQuote}>
          <p className={s.pullQuoteText}>
            &ldquo;Det vigtigste for mig er, at du føler dig tryg, hørt og set
            gennem hele processen.&rdquo;
          </p>
          <p className={s.pullQuoteAuthor}>— A Falkvard Tattoo</p>
        </div>
      </section>

      {/* ========== DECORATIVE DISPLAY TEXT ========== */}
      <div className={s.displayText}>tryghed</div>

      {/* ========== 8. NUMBERED STEPS ========== */}
      <section className={s.section}>
        <p className={s.sectionLabel}>09 — Numbered Steps</p>
        <h2 className={s.sectionTitle}>Process Steps</h2>

        <div className={s.stepsGrid}>
          <div className={s.step}>
            <span className={s.stepNumber}>01</span>
            <h4 className={s.stepTitle}>Find din inspiration</h4>
            <p className={s.stepText}>
              Kig vores galleri igennem, eller fortæl os om din idé. Vi hjælper
              dig med at forme den.
            </p>
          </div>
          <div className={s.step}>
            <span className={s.stepNumber}>02</span>
            <h4 className={s.stepTitle}>Send en forespørgsel</h4>
            <p className={s.stepText}>
              Brug vores chat eller bookingformular til at fortælle os om dit
              projekt.
            </p>
          </div>
          <div className={s.step}>
            <span className={s.stepNumber}>03</span>
            <h4 className={s.stepTitle}>Vi designer sammen</h4>
            <p className={s.stepText}>
              Vi skaber et unikt design, der passer præcist til dig og din
              historie.
            </p>
          </div>
          <div className={s.step}>
            <span className={s.stepNumber}>04</span>
            <h4 className={s.stepTitle}>Bliv tatoveret</h4>
            <p className={s.stepText}>
              I trygge rammer i vores private studie i Svendborg. Kun dig og
              tatovøren.
            </p>
          </div>
        </div>
      </section>

      {/* ========== 9. FORM ELEMENTS ========== */}
      <section className={s.section}>
        <p className={s.sectionLabel}>10 — Forms</p>
        <h2 className={s.sectionTitle}>Form Elements</h2>

        <div className={s.formGrid}>
          <div className={s.formGroup}>
            <label className={s.formLabel}>Navn</label>
            <input
              type="text"
              className={s.formInput}
              placeholder="Dit fulde navn"
            />
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>Email</label>
            <input
              type="email"
              className={s.formInput}
              placeholder="din@email.dk"
            />
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>Service</label>
            <select className={s.formSelect}>
              <option>Vælg en service</option>
              <option>Tatovering</option>
              <option>Piercing</option>
              <option>Konsultation</option>
            </select>
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>Telefon</label>
            <input
              type="tel"
              className={s.formInput}
              placeholder="+45 00 00 00 00"
            />
          </div>
          <div className={`${s.formGroup} ${s.fullWidth}`}>
            <label className={s.formLabel}>Besked</label>
            <textarea
              className={s.formTextarea}
              placeholder="Fortæl os om din idé..."
            />
          </div>
        </div>
      </section>

      {/* ========== 10. SCROLL REVEAL ========== */}
      <section className={s.section}>
        <p className={s.sectionLabel}>11 — Animation</p>
        <h2 className={s.sectionTitle}>Scroll Reveal</h2>
        <p className={s.sectionDescription}>
          Elements fade in and slide up as they enter the viewport. Staggered
          delays for groups.
        </p>

        <div className={s.revealDemo}>
          <div className={s.revealBox}>
            <h4 className={s.cardTitle}>First element</h4>
            <p className={s.cardText}>Fades in immediately</p>
          </div>
          <div className={s.revealBox}>
            <h4 className={s.cardTitle}>Second element</h4>
            <p className={s.cardText}>150ms delay</p>
          </div>
          <div className={s.revealBox}>
            <h4 className={s.cardTitle}>Third element</h4>
            <p className={s.cardText}>300ms delay</p>
          </div>
        </div>
      </section>

    </div>
  );
}
