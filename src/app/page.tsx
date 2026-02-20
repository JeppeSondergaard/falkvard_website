import Link from "next/link";
import Image from "next/image";
import TentIcon from "@/components/TentIcon";
import galleryData from "@/data/instagram-posts.json";
import s from "./page.module.scss";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroWatermark}>
          <TentIcon size={400} variant="white" />
        </div>
        <div className={s.heroContent}>
          <p className={s.heroLabel}>Privat studie i Svendborg</p>
          <h1 className={s.heroTitle}>
            Tatoveringer
            <br />
            med sjæl
          </h1>
          <p className={s.heroSub}>
            Nordisk, Ornamental, Dark Art & blomster — skabt i trygge rammer,
            kun for dig.
          </p>
          <div className={s.heroCtas}>
            <Link href="/booking" className={s.heroBtn}>
              Book en tid
            </Link>
            <Link href="/gallery" className={s.heroBtnOutline}>
              Se galleri
            </Link>
          </div>
        </div>
        <div className={s.heroScroll}>
          <span>Scroll</span>
          <div className={s.heroScrollLine} />
        </div>
      </section>

      {/* Intro */}
      <section className={s.intro}>
        <div className={s.introInner}>
          <p className={s.sectionLabel}>Historien</p>
          <h2 className={s.introHeading}>
            Et privat studie hvor kunden altid er i centrum
          </h2>
          <p className={s.introText}>
            Det vigtigste for mig er, at du føler dig tryg, hørt og set gennem
            hele processen. Jeg er her for at hjælpe dig med at finde det rette
            design, der passer til dig og din historie.
          </p>
          <Link href="/about" className={s.ghostLink}>
            Læs hele historien
          </Link>
        </div>
      </section>

      {/* Featured Work */}
      <section className={s.featured}>
        <div className={s.featuredInner}>
          <p className={s.sectionLabel}>Udvalgt arbejde</p>
          <h2 className={s.featuredHeading}>Seneste tatoveringer</h2>
          <div className={s.featuredGrid}>
            {galleryData.slice(0, 6).map((post) => (
              <div key={post.shortcode} className={s.featuredItem}>
                <Image
                  src={post.src}
                  alt={post.caption ? post.caption.split("\n")[0].substring(0, 60) : "Tatovering"}
                  width={640}
                  height={640}
                  unoptimized
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
            ))}
          </div>
          <Link href="/gallery" className={s.ghostLink}>
            Se hele galleriet
          </Link>
        </div>
      </section>

      {/* Services Preview */}
      <section className={s.services}>
        <div className={s.servicesInner}>
          <p className={s.sectionLabel}>Services</p>
          <h2 className={s.servicesHeading}>Hvad vi tilbyder</h2>
          <div className={s.servicesGrid}>
            <div className={s.serviceCard}>
              <span className={s.serviceNumber}>01</span>
              <h3 className={s.serviceTitle}>Tatovering</h3>
              <p className={s.serviceText}>
                Custom designs i nordisk, ornamental, dark art og blomster
                stilarter. Altid unikke, altid personlige.
              </p>
            </div>
            <div className={s.serviceCardAccent}>
              <span className={s.serviceNumber}>02</span>
              <h3 className={s.serviceTitle}>Piercing</h3>
              <p className={s.serviceText}>
                Professionel piercing med kvalitetssmykker i et trygt og sterilt
                miljø.
              </p>
            </div>
            <div className={s.serviceCard}>
              <span className={s.serviceNumber}>03</span>
              <h3 className={s.serviceTitle}>Konsultation</h3>
              <p className={s.serviceText}>
                Gratis forhåndssamtale hvor vi sammen finder det perfekte design
                og placering.
              </p>
            </div>
          </div>
          <Link href="/services" className={s.ghostLink}>
            Se alle services
          </Link>
        </div>
      </section>

      {/* Pull Quote */}
      <section className={s.quote}>
        <div className={s.quoteInner}>
          <TentIcon size={36} variant="white" />
          <blockquote className={s.quoteText}>
            &ldquo;Det vigtigste for mig er, at du føler dig tryg, hørt og set
            gennem hele processen.&rdquo;
          </blockquote>
          <p className={s.quoteAuthor}>— A Falkvard Tattoo</p>
        </div>
      </section>

      {/* Process Steps */}
      <section className={s.process}>
        <div className={s.processInner}>
          <p className={s.sectionLabel}>Processen</p>
          <h2 className={s.processHeading}>Sådan booker du</h2>
          <div className={s.stepsGrid}>
            <div className={s.step}>
              <span className={s.stepNum}>01</span>
              <h4 className={s.stepTitle}>Find din inspiration</h4>
              <p className={s.stepText}>
                Kig vores galleri igennem, eller fortæl os om din idé.
              </p>
            </div>
            <div className={s.step}>
              <span className={s.stepNum}>02</span>
              <h4 className={s.stepTitle}>Send en forespørgsel</h4>
              <p className={s.stepText}>
                Brug bookingformularen eller skriv direkte til os.
              </p>
            </div>
            <div className={s.step}>
              <span className={s.stepNum}>03</span>
              <h4 className={s.stepTitle}>Vi designer sammen</h4>
              <p className={s.stepText}>
                Vi skaber et unikt design, der passer præcist til dig.
              </p>
            </div>
            <div className={s.step}>
              <span className={s.stepNum}>04</span>
              <h4 className={s.stepTitle}>Bliv tatoveret</h4>
              <p className={s.stepText}>
                I trygge rammer i vores private studie. Kun dig og tatovøren.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={s.cta}>
        <div className={s.ctaInner}>
          <h2 className={s.ctaHeading}>Klar til din næste tatovering?</h2>
          <p className={s.ctaText}>
            Book en gratis konsultation og lad os finde dit perfekte design
            sammen.
          </p>
          <Link href="/booking" className={s.ctaBtn}>
            Book en tid
          </Link>
        </div>
      </section>
    </>
  );
}
