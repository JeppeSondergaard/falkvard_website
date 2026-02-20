"use client";

import { useState } from "react";
import Link from "next/link";
import s from "./page.module.scss";

const PRE_CARE_ITEMS = [
  "Sov godt natten før",
  "Spis et godt måltid inden",
  "Undgå alkohol 24 timer før",
  "Drik masser af vand",
  "Bær løstsiddende, behageligt tøj",
];

const AFTERCARE_STEPS = [
  {
    title: "Dag 1",
    text: "Hold bandagen på i 2-4 timer. Vask forsigtigt med mild sæbe.",
  },
  {
    title: "Dag 2-3",
    text: "Vask 2-3 gange dagligt. Påfør et tyndt lag aftercare creme.",
  },
  {
    title: "Uge 1-2",
    text: "Tatoveringen begynder at skalle. Lad være med at pille!",
  },
  {
    title: "Uge 3-4",
    text: "Huden heler sig selv. Fortsæt med at fugte.",
  },
];

const DOS = [
  "Hold rent",
  "Fugt dagligt",
  "Bær solcreme efter heling",
  "Kontakt os ved spørgsmål",
];

const DONTS = [
  "Rids eller pil",
  "Svøm eller gå i sauna de første 2 uger",
  "Direkte sollys",
  "Stramme klæder over tatoveringen",
];

const FAQ_ITEMS = [
  {
    q: "Hvornår kan jeg træne igen?",
    a: "Vent mindst 24-48 timer med intens træning. Undgå sved på tatoveringen de første dage. Løb og let motion er ofte okay efter et par dage.",
  },
  {
    q: "Kan jeg gå i solen?",
    a: "Undgå direkte sollys på den nye tatovering i mindst 2-4 uger. Brug altid solcreme med høj faktor på tatoveringen efter heling.",
  },
  {
    q: "Hvad hvis tatoveringen er rød og hævet?",
    a: "Lidt rødme og hævelse de første dage er normalt. Hold den ren og fugtig. Kontakt os eller en læge ved stærk hævelse, pus eller feber.",
  },
  {
    q: "Hvornår skal jeg komme til touch-up?",
    a: "Efter 4-6 uger er huden fuldt helet. Kom til touch-up hvis nogle linjer eller farver er blevet utydelige — det tilbyder vi som en del af oplevelsen.",
  },
];

export default function AftercarePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1 className={s.heroHeading}>Aftercare</h1>
          <p className={s.heroIntro}>
            Sådan passer du på din nye tatovering
          </p>
        </div>
      </section>

      {/* Pre-care */}
      <section className={s.preCare}>
        <div className={s.preCareInner}>
          <p className={s.preCareLabel}>Før din session</p>
          <h2 className={s.preCareHeading}>Forberedelse</h2>
          <div className={s.preCareCard}>
            <ul className={s.preCareList}>
              {PRE_CARE_ITEMS.map((item, i) => (
                <li key={i} className={s.preCareItem}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Aftercare Steps */}
      <section className={s.steps}>
        <div className={s.stepsInner}>
          <h2 className={s.stepsHeading}>De første dage</h2>
          <ol className={s.stepsList}>
            {AFTERCARE_STEPS.map((step, i) => (
              <li key={i} className={s.stepItem}>
                <span className={s.stepNum}>{i + 1}</span>
                <div>
                  <strong className={s.stepText}>{step.title}: </strong>
                  <span className={s.stepText}>{step.text}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Do's and Don'ts */}
      <section className={s.dosDonts}>
        <div className={s.dosDontsInner}>
          <div className={s.dosCard}>
            <h3 className={s.dosDontsTitle}>Gør</h3>
            <ul className={s.dosList}>
              {DOS.map((item, i) => (
                <li key={i} className={s.dosItem}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className={s.dontsCard}>
            <h3 className={s.dosDontsTitle}>Undgå</h3>
            <ul className={s.dontsList}>
              {DONTS.map((item, i) => (
                <li key={i} className={s.dontsItem}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Piercing Aftercare */}
      <section className={s.piercing}>
        <div className={s.piercingInner}>
          <h2 className={s.piercingHeading}>Aftercare for piercing</h2>
          <div className={s.piercingCard}>
            <p className={s.piercingText}>
              Hold piercingen ren med saltvand eller den anbefalede løsning.
              Undgå at dreje eller skifte smykke før heling. Helingsperioden er
              typisk 6-12 uger afhængigt af placering — øreflip 6-8 uger,
              navle længere. Undgå at sove på piercingen og hold den tør.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={s.faq}>
        <div className={s.faqInner}>
          <h2 className={s.faqHeading}>Ofte stillede spørgsmål</h2>
          <div className={s.faqList}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={s.faqItem}>
                <button
                  type="button"
                  className={s.faqQuestion}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{item.q}</span>
                  <span
                    className={`${s.faqIcon} ${openFaq === i ? s.open : ""}`}
                    aria-hidden
                  >
                    ▼
                  </span>
                </button>
                {openFaq === i && (
                  <div className={s.faqAnswer}>
                    <p className={s.faqAnswerInner}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={s.cta}>
        <div className={s.ctaInner}>
          <h2 className={s.ctaHeading}>Har du spørgsmål?</h2>
          <Link href="/contact" className={s.ctaLink}>
            Kontakt os
          </Link>
        </div>
      </section>
    </>
  );
}
