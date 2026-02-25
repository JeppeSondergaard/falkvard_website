"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import s from "./page.module.scss";

type ServiceType = "tatovering" | "piercing" | "konsultation" | "";
type SubmitState = "idle" | "loading" | "success" | "error";
type FaqItem = { q: string; a: string };

const DEFAULT_FAQ: FaqItem[] = [
  {
    q: "Hvor lang tid tager en tatovering?",
    a: "Det kommer helt an på størrelse og detaljegrad. Små tatoveringer tager typisk 1-2 timer, mens større projekter kan tage flere sessioner.",
  },
  {
    q: "Gør det ondt?",
    a: "Smerte er individuelt, men de fleste beskriver det som et ubehag der er til at holde ud. Vi sørger for, at du er så komfortabel som muligt.",
  },
  {
    q: "Kan jeg tage en ven med?",
    a: "Ja, du er velkommen til at tage én person med til din session.",
  },
  {
    q: "Hvad koster en tatovering?",
    a: "Prisen afhænger af størrelse, kompleksitet og placering. Minimum er 800 kr. Vi aftaler altid en fast pris inden vi starter.",
  },
  {
    q: "Skal jeg have en idé klar?",
    a: "Det behøver du ikke! Vi kan sagtens designe noget sammen baseret på dine ønsker og idéer. Book en konsultation, så tager vi en snak.",
  },
];

export default function BookingPage() {
  const [service, setService] = useState<ServiceType>("");
  const [step, setStep] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const [heading, setHeading] = useState("Book en tid");
  const [intro, setIntro] = useState(
    "Udfyld formularen herunder, så vender jeg tilbage hurtigst muligt med en bekræftelse og evt. designforslag."
  );
  const [faq, setFaq] = useState<FaqItem[]>(DEFAULT_FAQ);

  useEffect(() => {
    fetch("/api/site-content")
      .then((res) => res.json())
      .then((data: Record<string, string>) => {
        if (data["booking.heading"]) setHeading(data["booking.heading"]);
        if (data["booking.intro"]) setIntro(data["booking.intro"]);
        if (data["booking.faq"]) {
          try {
            const parsed = JSON.parse(data["booking.faq"]);
            if (Array.isArray(parsed)) setFaq(parsed);
          } catch { /* keep default */ }
        }
      })
      .catch(() => { /* use defaults */ });
  }, []);

  function handleServiceSelect(svc: ServiceType) {
    setService(svc);
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitState("loading");
    setSubmitError("");

    const form = formRef.current;
    if (!form) return;

    const data = new FormData(form);
    const body = {
      name: data.get("name") as string,
      email: data.get("email") as string,
      phone: data.get("phone") as string,
      service,
      placement: data.get("placement") as string,
      size: data.get("size") as string,
      description: data.get("description") as string,
      reference_urls: (data.get("reference") as string) || undefined,
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Noget gik galt. Prøv igen.");
      }

      setSubmitState("success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Ukendt fejl");
      setSubmitState("error");
    }
  }

  if (submitState === "success") {
    return (
      <section className={s.section}>
        <div className={s.inner}>
          <div className={s.successState}>
            <span className={s.successIcon}>&#10003;</span>
            <h2 className={s.successTitle}>Tak for din forespørgsel!</h2>
            <p className={s.successText}>
              Vi har modtaget din booking-forespørgsel og vender tilbage
              hurtigst muligt. Tjek din email for en bekræftelse.
            </p>
            <Link href="/home" className={s.ctaBtn}>
              Tilbage til forsiden
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className={s.section}>
        <div className={s.inner}>
          <h1 className={s.heading}>{heading}</h1>
          <p className={s.intro}>{intro}</p>

          {/* Step indicators */}
          <div className={s.steps}>
            <div className={`${s.stepDot} ${step >= 1 ? s.active : ""}`}>
              <span>1</span>
              <small>Ydelse</small>
            </div>
            <div className={s.stepLine} />
            <div className={`${s.stepDot} ${step >= 2 ? s.active : ""}`}>
              <span>2</span>
              <small>Detaljer</small>
            </div>
          </div>

          {/* Step 1: Service selection */}
          {step === 1 && (
            <div className={s.serviceGrid}>
              <button
                type="button"
                className={`${s.serviceCard} ${service === "tatovering" ? s.selected : ""}`}
                onClick={() => handleServiceSelect("tatovering")}
              >
                <h3 className={s.serviceTitle}>Tatovering</h3>
                <p className={s.serviceDesc}>
                  Book en tid til ny tatovering, touch-up eller cover-up.
                </p>
              </button>
              <button
                type="button"
                className={`${s.serviceCard} ${service === "piercing" ? s.selected : ""}`}
                onClick={() => handleServiceSelect("piercing")}
              >
                <h3 className={s.serviceTitle}>Piercing</h3>
                <p className={s.serviceDesc}>
                  Professionel piercing med kvalitetssmykker i titanium.
                </p>
              </button>
              <button
                type="button"
                className={`${s.serviceCard} ${service === "konsultation" ? s.selected : ""}`}
                onClick={() => handleServiceSelect("konsultation")}
              >
                <h3 className={s.serviceTitle}>Konsultation</h3>
                <p className={s.serviceDesc}>
                  Gratis snak om dit projekt inden du beslutter dig.
                </p>
              </button>
            </div>
          )}

          {/* Step 2: Detail form */}
          {step === 2 && (
            <>
              <button
                type="button"
                className={s.backBtn}
                onClick={() => setStep(1)}
              >
                &larr; Tilbage
              </button>
              <form
                ref={formRef}
                className={s.form}
                onSubmit={handleSubmit}
              >
                <div className={s.fieldGroup}>
                  <label className={s.label} htmlFor="name">
                    Navn *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className={s.input}
                    placeholder="Dit fulde navn"
                  />
                </div>

                <div className={s.fieldRow}>
                  <div className={s.fieldGroup}>
                    <label className={s.label} htmlFor="email">
                      Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className={s.input}
                      placeholder="din@email.dk"
                    />
                  </div>
                  <div className={s.fieldGroup}>
                    <label className={s.label} htmlFor="phone">
                      Telefon
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className={s.input}
                      placeholder="+45 ..."
                    />
                  </div>
                </div>

                {service === "tatovering" && (
                  <>
                    <div className={s.fieldRow}>
                      <div className={s.fieldGroup}>
                        <label className={s.label} htmlFor="placement">
                          Placering
                        </label>
                        <input
                          id="placement"
                          name="placement"
                          type="text"
                          className={s.input}
                          placeholder="F.eks. underarm, ryg"
                        />
                      </div>
                      <div className={s.fieldGroup}>
                        <label className={s.label} htmlFor="size">
                          Ca. størrelse
                        </label>
                        <input
                          id="size"
                          name="size"
                          type="text"
                          className={s.input}
                          placeholder="F.eks. 10x15 cm"
                        />
                      </div>
                    </div>

                    <div className={s.fieldGroup}>
                      <label className={s.label} htmlFor="description">
                        Beskriv dit ønskedesign *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        required
                        rows={5}
                        className={s.textarea}
                        placeholder="Fortæl om din idé, stil, motiver..."
                      />
                    </div>

                    <div className={s.fieldGroup}>
                      <label className={s.label} htmlFor="reference">
                        Reference-billeder (links)
                      </label>
                      <input
                        id="reference"
                        name="reference"
                        type="text"
                        className={s.input}
                        placeholder="Pinterest, Instagram links..."
                      />
                    </div>
                  </>
                )}

                {service === "piercing" && (
                  <div className={s.fieldGroup}>
                    <label className={s.label} htmlFor="description">
                      Hvilken piercing? *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      required
                      rows={3}
                      className={s.textarea}
                      placeholder="F.eks. helix, septum, nostril..."
                    />
                  </div>
                )}

                {service === "konsultation" && (
                  <div className={s.fieldGroup}>
                    <label className={s.label} htmlFor="description">
                      Hvad vil du gerne snakke om?
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className={s.textarea}
                      placeholder="Kort beskrivelse af dit projekt..."
                    />
                  </div>
                )}

                {submitState === "error" && submitError && (
                  <p className={s.errorMsg}>{submitError}</p>
                )}

                <button
                  type="submit"
                  className={s.submitBtn}
                  disabled={submitState === "loading"}
                >
                  {submitState === "loading"
                    ? "Sender..."
                    : "Send forespørgsel"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className={s.faqSection}>
        <div className={s.inner}>
          <h2 className={s.faqHeading}>Ofte stillede spørgsmål</h2>
          <div className={s.faqList}>
            {faq.map((item, i) => (
              <div
                key={i}
                className={`${s.faqItem} ${openFaq === i ? s.faqOpen : ""}`}
              >
                <button
                  type="button"
                  className={s.faqQuestion}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{item.q}</span>
                  <span className={s.faqToggle}>
                    {openFaq === i ? "−" : "+"}
                  </span>
                </button>
                {openFaq === i && (
                  <p className={s.faqAnswer}>{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
