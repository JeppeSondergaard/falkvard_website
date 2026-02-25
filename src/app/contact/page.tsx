import Link from "next/link";
import { getContentBulk } from "@/lib/content";
import s from "./page.module.scss";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  const c = getContentBulk([
    "contact.hero_heading",
    "contact.hero_intro",
    "contact.address_line1",
    "contact.address_line2",
    "contact.address_note",
    "contact.instagram",
    "contact.instagram_url",
    "contact.instagram_note",
    "contact.hours",
    "contact.hours_note",
    "contact.cta_heading",
    "contact.cta_text",
  ]);

  return (
    <>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1 className={s.heroHeading}>{c["contact.hero_heading"]}</h1>
          <p className={s.heroIntro}>{c["contact.hero_intro"]}</p>
        </div>
      </section>

      {/* Contact Info */}
      <section className={s.info}>
        <div className={s.infoInner}>
          <div className={s.infoGrid}>
            <div className={s.infoCard}>
              <h3 className={s.infoTitle}>Adresse</h3>
              <p className={s.infoText}>{c["contact.address_line1"]}</p>
              <p className={s.infoText}>{c["contact.address_line2"]}</p>
              <p className={s.infoNote}>{c["contact.address_note"]}</p>
            </div>
            <div className={s.infoCard}>
              <h3 className={s.infoTitle}>Kontakt</h3>
              <p className={s.infoText}>
                <a
                  href={c["contact.instagram_url"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.infoLink}
                >
                  {c["contact.instagram"]}
                </a>
              </p>
              <p className={s.infoNote}>{c["contact.instagram_note"]}</p>
            </div>
            <div className={s.infoCard}>
              <h3 className={s.infoTitle}>Åbningstider</h3>
              <p className={s.infoText}>{c["contact.hours"]}</p>
              <p className={s.infoNote}>{c["contact.hours_note"]}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className={s.mapSection}>
        <div className={s.mapInner}>
          <div className={s.mapContainer}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2272.5!2d10.6077!3d55.0597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x464d31e8a5b7c0c7%3A0x0!2sRamsherred%201%2C%205700%20Svendborg!5e0!3m2!1sda!2sdk!4v1"
              className={s.mapIframe}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Falkvard Tattoo — Ramsherred 1, Svendborg"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={s.cta}>
        <div className={s.ctaInner}>
          <h2 className={s.ctaHeading}>{c["contact.cta_heading"]}</h2>
          <p className={s.ctaText}>{c["contact.cta_text"]}</p>
          <Link href="/booking" className={s.ctaBtn}>
            Book en tid
          </Link>
        </div>
      </section>
    </>
  );
}
