"use client";

import { useState } from "react";
import s from "./page.module.scss";

const EMNE_OPTIONS = [
  { value: "tatovering", label: "Tatovering" },
  { value: "piercing", label: "Piercing" },
  { value: "konsultation", label: "Konsultation" },
  { value: "andet", label: "Andet" },
] as const;

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emne, setEmne] = useState("");
  const [besked, setBesked] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: send to API or email
  }

  return (
    <>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1 className={s.heroHeading}>Kontakt</h1>
          <p className={s.heroIntro}>Vi vil gerne høre fra dig</p>
        </div>
      </section>

      {/* Two-column: Form + Info cards */}
      <section className={s.contactSection}>
        <div className={s.contactInner}>
          <form className={s.form} onSubmit={handleSubmit}>
            <div>
              <label className={s.label} htmlFor="navn">
                Navn
              </label>
              <input
                id="navn"
                type="text"
                className={s.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
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
            <div>
              <label className={s.label} htmlFor="telefon">
                Telefon
              </label>
              <input
                id="telefon"
                type="tel"
                className={s.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className={s.label} htmlFor="emne">
                Emne
              </label>
              <select
                id="emne"
                className={s.select}
                value={emne}
                onChange={(e) => setEmne(e.target.value)}
                required
              >
                <option value="">Vælg emne</option>
                {EMNE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={s.label} htmlFor="besked">
                Besked
              </label>
              <textarea
                id="besked"
                className={s.textarea}
                value={besked}
                onChange={(e) => setBesked(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={s.submitBtn}>
              Send besked
            </button>
          </form>

          <div className={s.infoCards}>
            <div className={s.addressCard}>
              <span className={s.cardLabel}>Adresse</span>
              <p className={s.cardContent}>
                Ramsherred 1, 5700 Svendborg
              </p>
            </div>
            <div className={s.hoursCard}>
              <span className={s.cardLabel}>Åbningstider</span>
              <p className={s.cardContent}>Åbent efter aftale</p>
              <p className={s.cardSub}>Skriv eller ring for at booke</p>
            </div>
            <div className={s.socialCard}>
              <span className={s.cardLabel}>Social</span>
              <a
                href="https://instagram.com/a_falkvard_tattoo"
                target="_blank"
                rel="noopener noreferrer"
                className={s.socialLink}
              >
                @a_falkvard_tattoo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Map placeholder */}
      <section className={s.mapSection} aria-hidden>
        <div className={s.mapPlaceholder}>
          <span className={s.mapPlaceholderText}>Kort kommer snart</span>
        </div>
      </section>
    </>
  );
}
