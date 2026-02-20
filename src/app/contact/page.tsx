import Link from "next/link";
import s from "./page.module.scss";

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1 className={s.heroHeading}>Kontakt</h1>
          <p className={s.heroIntro}>
            Har du spørgsmål eller vil du booke en tid? Du er altid velkommen
            til at skrive.
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section className={s.info}>
        <div className={s.infoInner}>
          <div className={s.infoGrid}>
            <div className={s.infoCard}>
              <h3 className={s.infoTitle}>Adresse</h3>
              <p className={s.infoText}>Ramsherred 1</p>
              <p className={s.infoText}>5700 Svendborg</p>
              <p className={s.infoNote}>Privat studie — kun efter aftale</p>
            </div>
            <div className={s.infoCard}>
              <h3 className={s.infoTitle}>Kontakt</h3>
              <p className={s.infoText}>
                <a
                  href="https://www.instagram.com/a_falkvard_tattoo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.infoLink}
                >
                  @a_falkvard_tattoo
                </a>
              </p>
              <p className={s.infoNote}>
                Instagram er den hurtigste måde at nå mig
              </p>
            </div>
            <div className={s.infoCard}>
              <h3 className={s.infoTitle}>Åbningstider</h3>
              <p className={s.infoText}>Kun efter aftale</p>
              <p className={s.infoNote}>
                Book din tid, så finder vi et tidspunkt der passer
              </p>
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
          <h2 className={s.ctaHeading}>Klar til at booke?</h2>
          <p className={s.ctaText}>
            Udfyld vores booking-formular, så vender jeg tilbage hurtigst
            muligt.
          </p>
          <Link href="/booking" className={s.ctaBtn}>
            Book en tid
          </Link>
        </div>
      </section>
    </>
  );
}
