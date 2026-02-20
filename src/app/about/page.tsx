import Link from "next/link";
import Image from "next/image";
import s from "./page.module.scss";

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1 className={s.heroHeading}>Om Falkvard Tattoo</h1>
          <p className={s.heroIntro}>
            Hej allesammen 🖤 Jeg har åbent efter aftale, da jeg driver et privat
            studie og ikke en butik eller shop.
          </p>
        </div>
      </section>

      {/* Artist Story */}
      <section className={s.artistStory}>
        <div className={s.artistStoryInner}>
          <div className={s.artistImagePlaceholder}>
            <Image
              src="/gallery/profile.jpg"
              alt="A Falkvard Tattoo"
              width={320}
              height={320}
              unoptimized
              style={{ objectFit: "cover", width: "100%", height: "100%", borderRadius: "8px" }}
            />
          </div>
          <div className={s.artistStoryContent}>
            <h2 className={s.artistStoryHeading}>Historien bag studiet</h2>
            <p className={s.artistStoryText}>
              I mit private studie er kunden altid i centrum. Det vigtigste for
              mig er, at du føler dig tryg, hørt og set gennem hele processen.
              Jeg er her for at hjælpe dig med at finde det rette design, der
              passer til dig og din historie.
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className={s.philosophy}>
        <div className={s.philosophyInner}>
          <blockquote className={s.quoteBlock}>
            <p className={s.quoteText}>
              &ldquo;Det vigtigste for mig er, at du føler dig tryg, hørt og set
              gennem hele processen.&rdquo;
            </p>
          </blockquote>
          <div className={s.valuesGrid}>
            <div className={s.valueItem}>
              <h3 className={s.valueTitle}>Tryghed</h3>
              <p className={s.valueDesc}>
                Dit private rum, din trygge oplevelse
              </p>
            </div>
            <div className={s.valueItem}>
              <h3 className={s.valueTitle}>Håndværk</h3>
              <p className={s.valueDesc}>
                Omhyggelig teknik, unikke designs
              </p>
            </div>
            <div className={s.valueItem}>
              <h3 className={s.valueTitle}>Sjæl</h3>
              <p className={s.valueDesc}>
                Personlig forbindelse, meningsfulde tatoveringer
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Private Studio */}
      <section className={s.privateStudio}>
        <div className={s.privateStudioInner}>
          <h2 className={s.privateStudioHeading}>
            Sådan booker du en tid til en tatovering hos mig:
          </h2>
          <ul className={s.benefitsList}>
            <li className={s.benefitItem}>
              <span className={s.benefitNum}>1</span>
              <span className={s.benefitText}>Velkommen – fedt at du har fundet mig!</span>
            </li>
            <li className={s.benefitItem}>
              <span className={s.benefitNum}>2</span>
              <span className={s.benefitText}>Find din inspiration.</span>
            </li>
            <li className={s.benefitItem}>
              <span className={s.benefitNum}>3</span>
              <span className={s.benefitText}>Send en forespørgsel.</span>
            </li>
            <li className={s.benefitItem}>
              <span className={s.benefitNum}>4</span>
              <span className={s.benefitText}>Vi designer sammen.</span>
            </li>
            <li className={s.benefitItem}>
              <span className={s.benefitNum}>5</span>
              <span className={s.benefitText}>
                Bliv tatoveret i trygge rammer.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className={s.cta}>
        <div className={s.ctaInner}>
          <h2 className={s.ctaHeading}>
            Lad os snakke om dit næste projekt
          </h2>
          <Link href="/booking" className={s.ctaBtn}>
            Book en tid
          </Link>
        </div>
      </section>
    </>
  );
}
