"use client";

import { useState, useRef } from "react";
import s from "./page.module.scss";

type ServiceType = "tatovering" | "piercing" | "konsultation" | "";

const STIL_OPTIONS = [
  { value: "nordisk", label: "Nordisk" },
  { value: "ornamental", label: "Ornamental" },
  { value: "dark-art", label: "Dark Art" },
  { value: "blomster", label: "Blomster" },
  { value: "andet", label: "Andet" },
];

const STORRELSE_OPTIONS = [
  { value: "lille", label: "Lille (<10cm)" },
  { value: "mellem", label: "Mellem (10–20cm)" },
  { value: "stor", label: "Stor (>20cm)" },
];

const PIERCING_PLACERING = [
  { value: "ore", label: "Øre" },
  { value: "naese", label: "Næse" },
  { value: "navle", label: "Navle" },
  { value: "andet", label: "Andet" },
];

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<ServiceType>("");
  // Step 2 – Tatovering
  const [stil, setStil] = useState("");
  const [storrelse, setStorrelse] = useState("");
  const [placering, setPlacering] = useState("");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  // Step 2 – Piercing
  const [piercingPlacering, setPiercingPlacering] = useState("");
  // Step 2 – Konsultation
  const [konsultationBeskrivelse, setKonsultationBeskrivelse] = useState("");
  // Step 3
  const [navn, setNavn] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [dato, setDato] = useState("");
  const [bemaerkninger, setBemaerkninger] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setReferenceFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) setReferenceFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function canProceedStep1() {
    return service !== "";
  }

  function canProceedStep2() {
    if (service === "tatovering") {
      return stil && storrelse && placering.trim() && beskrivelse.trim();
    }
    if (service === "piercing") {
      return piercingPlacering !== "";
    }
    if (service === "konsultation") {
      return konsultationBeskrivelse.trim() !== "";
    }
    return false;
  }

  function canProceedStep3() {
    return navn.trim() !== "" && email.trim() !== "";
  }

  function handleNext() {
    if (step < 4) setStep(step + 1);
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: send booking request
  }

  return (
    <section className={s.section}>
      <div className={s.inner}>
        <h1 className={s.pageTitle}>Book en tid</h1>

        <div className={s.formCard}>
          {/* Progress indicator */}
          <div className={s.progress} role="tablist" aria-label="Trin">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`${s.progressStep} ${step === i ? s.active : ""} ${step > i ? s.done : ""}`}
                aria-current={step === i ? "step" : undefined}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1 — Service */}
            {step === 1 && (
              <div className={s.serviceGrid}>
                {[
                  {
                    id: "tatovering" as const,
                    title: "Tatovering",
                    desc: "Unikke tatoveringer tilpasset dig",
                  },
                  {
                    id: "piercing" as const,
                    title: "Piercing",
                    desc: "Professionel piercing i trygge rammer",
                  },
                  {
                    id: "konsultation" as const,
                    title: "Konsultation",
                    desc: "Snak om idé og design først",
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`${s.serviceCard} ${service === opt.id ? s.selected : ""}`}
                    onClick={() => setService(opt.id)}
                  >
                    <h2 className={s.serviceTitle}>{opt.title}</h2>
                    <p className={s.serviceDesc}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 — Details */}
            {step === 2 && (
              <>
                {service === "tatovering" && (
                  <>
                    <div className={s.fieldGroup}>
                      <label className={s.label} htmlFor="stil">
                        Stil
                      </label>
                      <select
                        id="stil"
                        className={s.select}
                        value={stil}
                        onChange={(e) => setStil(e.target.value)}
                        required
                      >
                        <option value="">Vælg stil</option>
                        {STIL_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={s.fieldGroup}>
                      <label className={s.label} htmlFor="storrelse">
                        Størrelse
                      </label>
                      <select
                        id="storrelse"
                        className={s.select}
                        value={storrelse}
                        onChange={(e) => setStorrelse(e.target.value)}
                        required
                      >
                        <option value="">Vælg størrelse</option>
                        {STORRELSE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={s.fieldGroup}>
                      <label className={s.label} htmlFor="placering">
                        Placering
                      </label>
                      <input
                        id="placering"
                        type="text"
                        className={s.input}
                        value={placering}
                        onChange={(e) => setPlacering(e.target.value)}
                        placeholder="F.eks. underarm, ryg"
                        required
                      />
                    </div>
                    <div className={s.fieldGroup}>
                      <label className={s.label} htmlFor="beskrivelse">
                        Beskrivelse af idé
                      </label>
                      <textarea
                        id="beskrivelse"
                        className={s.textarea}
                        value={beskrivelse}
                        onChange={(e) => setBeskrivelse(e.target.value)}
                        required
                      />
                    </div>
                    <div className={s.fieldGroup}>
                      <label className={s.label}>Upload reference</label>
                      <div
                        className={s.fileZone}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          className={s.fileInput}
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                        <span className={s.fileZoneText}>
                          {referenceFile
                            ? referenceFile.name
                            : "Træk fil hertil eller klik for at vælge"}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                {service === "piercing" && (
                  <div className={s.fieldGroup}>
                    <label className={s.label} htmlFor="piercing-placering">
                      Placering
                    </label>
                    <select
                      id="piercing-placering"
                      className={s.select}
                      value={piercingPlacering}
                      onChange={(e) => setPiercingPlacering(e.target.value)}
                      required
                    >
                      <option value="">Vælg placering</option>
                      {PIERCING_PLACERING.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {service === "konsultation" && (
                  <div className={s.fieldGroup}>
                    <label className={s.label} htmlFor="konsultation-beskrivelse">
                      Beskrivelse
                    </label>
                    <textarea
                      id="konsultation-beskrivelse"
                      className={s.textarea}
                      value={konsultationBeskrivelse}
                      onChange={(e) => setKonsultationBeskrivelse(e.target.value)}
                      required
                    />
                  </div>
                )}
              </>
            )}

            {/* Step 3 — Contact */}
            {step === 3 && (
              <>
                <div className={s.fieldGroup}>
                  <label className={s.label} htmlFor="navn">
                    Navn
                  </label>
                  <input
                    id="navn"
                    type="text"
                    className={s.input}
                    value={navn}
                    onChange={(e) => setNavn(e.target.value)}
                    required
                  />
                </div>
                <div className={s.fieldGroup}>
                  <label className={s.label} htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={s.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className={s.fieldGroup}>
                  <label className={s.label} htmlFor="telefon">
                    Telefon
                  </label>
                  <input
                    id="telefon"
                    type="tel"
                    className={s.input}
                    value={telefon}
                    onChange={(e) => setTelefon(e.target.value)}
                  />
                </div>
                <div className={s.fieldGroup}>
                  <label className={s.label} htmlFor="dato">
                    Foretrukken dato
                  </label>
                  <input
                    id="dato"
                    type="date"
                    className={s.input}
                    value={dato}
                    onChange={(e) => setDato(e.target.value)}
                  />
                </div>
                <div className={s.fieldGroup}>
                  <label className={s.label} htmlFor="bemaerkninger">
                    Evt. bemærkninger
                  </label>
                  <textarea
                    id="bemaerkninger"
                    className={s.textarea}
                    value={bemaerkninger}
                    onChange={(e) => setBemaerkninger(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Step 4 — Confirmation */}
            {step === 4 && (
              <>
                <div className={s.summaryCard}>
                  <span className={s.summaryTitle}>Oversigt</span>
                  <p className={s.summaryRow}>
                    <strong>Service:</strong>{" "}
                    {service === "tatovering"
                      ? "Tatovering"
                      : service === "piercing"
                        ? "Piercing"
                        : "Konsultation"}
                  </p>
                  {service === "tatovering" && (
                    <>
                      <p className={s.summaryRow}>
                        <strong>Stil:</strong>{" "}
                        {STIL_OPTIONS.find((o) => o.value === stil)?.label ?? stil}
                      </p>
                      <p className={s.summaryRow}>
                        <strong>Størrelse:</strong>{" "}
                        {STORRELSE_OPTIONS.find((o) => o.value === storrelse)?.label ?? storrelse}
                      </p>
                      <p className={s.summaryRow}>
                        <strong>Placering:</strong> {placering}
                      </p>
                      <p className={s.summaryRow}>
                        <strong>Beskrivelse:</strong> {beskrivelse}
                      </p>
                      {referenceFile && (
                        <p className={s.summaryRow}>
                          <strong>Reference:</strong> {referenceFile.name}
                        </p>
                      )}
                    </>
                  )}
                  {service === "piercing" && (
                    <p className={s.summaryRow}>
                      <strong>Placering:</strong>{" "}
                      {PIERCING_PLACERING.find((o) => o.value === piercingPlacering)?.label ??
                        piercingPlacering}
                    </p>
                  )}
                  {service === "konsultation" && (
                    <p className={s.summaryRow}>
                      <strong>Beskrivelse:</strong> {konsultationBeskrivelse}
                    </p>
                  )}
                  <p className={s.summaryRow}>
                    <strong>Navn:</strong> {navn}
                  </p>
                  <p className={s.summaryRow}>
                    <strong>Email:</strong> {email}
                  </p>
                  {telefon && (
                    <p className={s.summaryRow}>
                      <strong>Telefon:</strong> {telefon}
                    </p>
                  )}
                  {dato && (
                    <p className={s.summaryRow}>
                      <strong>Foretrukken dato:</strong> {dato}
                    </p>
                  )}
                  {bemaerkninger && (
                    <p className={s.summaryRow}>
                      <strong>Bemærkninger:</strong> {bemaerkninger}
                    </p>
                  )}
                </div>
                <p className={s.confirmNote}>
                  Vi vender tilbage inden for 24 timer.
                </p>
                <button type="submit" className={s.submitBtn}>
                  Send forespørgsel
                </button>
              </>
            )}

            {/* Navigation */}
            {step < 4 && (
              <div className={s.navRow}>
                <button
                  type="button"
                  className={s.navBtn}
                  onClick={handleBack}
                  disabled={step === 1}
                >
                  Tilbage
                </button>
                <button
                  type="button"
                  className={`${s.navBtn} ${s.navBtnPrimary}`}
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !canProceedStep1()) ||
                    (step === 2 && !canProceedStep2()) ||
                    (step === 3 && !canProceedStep3())
                  }
                >
                  Næste
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
