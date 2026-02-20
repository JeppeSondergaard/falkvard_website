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
              <p className={s.infoText}>Privat studie i Svendborg</p>
              <p className={s.infoNote}>
                Adresse oplyses ved bekræftet booking
              </p>
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

      {/* Map placeholder */}
      <section className={s.mapSection}>
        <div className={s.mapInner}>
          <div className={s.mapPlaceholder}>
            <p className={s.mapText}>Svendborg, Fyn</p>
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
