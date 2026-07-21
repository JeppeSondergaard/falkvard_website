import Link from "next/link";
import Image from "next/image";
import TentIcon from "@/components/TentIcon";
import HeroVideo from "@/components/HeroVideo";
import PageFadeIn from "@/components/PageFadeIn";
import { getFrontpageImages, getGalleryImages } from "@/lib/images";
import { getContentBulk } from "@/lib/content";
import s from "./page.module.scss";

export const dynamic = "force-dynamic";

export default function Home() {
  const frontpageImages = getFrontpageImages();
  const featuredImages =
    frontpageImages.length > 0
      ? frontpageImages.slice(0, 6)
      : getGalleryImages().slice(0, 6);

  const c = getContentBulk([
    "home.hero_label",
    "home.hero_title",
    "home.hero_sub",
    "home.hero_background",
    "home.intro_label",
    "home.intro_heading",
    "home.intro_text",
    "home.services_heading",
    "home.service_1_title",
    "home.service_1_text",
    "home.service_2_title",
    "home.service_2_text",
    "home.service_3_title",
    "home.service_3_text",
    "home.quote_text",
    "home.quote_author",
    "home.process_heading",
    "home.process_steps",
    "home.cta_heading",
    "home.cta_text",
  ]);

  let processSteps: { title: string; text: string }[] = [];
  try {
    processSteps = JSON.parse(c["home.process_steps"]);
  } catch { /* use empty */ }

  const heroTitleParts = c["home.hero_title"].split("\n");

  return (
    <>
      <PageFadeIn />
      {/* Hero */}
      <section className={s.hero}>
        <HeroVideo className={s.heroVideo} src={c["home.hero_background"]} />
        <div className={s.heroOverlay} />
        <div className={s.heroWatermark}>
          <TentIcon size={400} variant="white" />
        </div>
        <div className={s.heroContent}>
          <p className={s.heroLabel}>{c["home.hero_label"]}</p>
          <h1 className={s.heroTitle}>
            {heroTitleParts.map((part, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {part}
              </span>
            ))}
          </h1>
          <p className={s.heroSub}>{c["home.hero_sub"]}</p>
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
          <p className={s.sectionLabel}>{c["home.intro_label"]}</p>
          <h2 className={s.introHeading}>{c["home.intro_heading"]}</h2>
          <p className={s.introText}>{c["home.intro_text"]}</p>
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
            {featuredImages.map((img) => (
              <div key={img.id} className={s.featuredItem}>
                <Image
                  src={img.src}
                  alt={img.alt_text || "Tatovering"}
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
          <h2 className={s.servicesHeading}>{c["home.services_heading"]}</h2>
          <div className={s.servicesGrid}>
            <div className={s.serviceCard}>
              <span className={s.serviceNumber}>01</span>
              <h3 className={s.serviceTitle}>{c["home.service_1_title"]}</h3>
              <p className={s.serviceText}>{c["home.service_1_text"]}</p>
            </div>
            <div className={s.serviceCardAccent}>
              <span className={s.serviceNumber}>02</span>
              <h3 className={s.serviceTitle}>{c["home.service_2_title"]}</h3>
              <p className={s.serviceText}>{c["home.service_2_text"]}</p>
            </div>
            <div className={s.serviceCard}>
              <span className={s.serviceNumber}>03</span>
              <h3 className={s.serviceTitle}>{c["home.service_3_title"]}</h3>
              <p className={s.serviceText}>{c["home.service_3_text"]}</p>
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
            &ldquo;{c["home.quote_text"]}&rdquo;
          </blockquote>
          <p className={s.quoteAuthor}>{c["home.quote_author"]}</p>
        </div>
      </section>

      {/* Process Steps */}
      <section className={s.process}>
        <div className={s.processInner}>
          <p className={s.sectionLabel}>Processen</p>
          <h2 className={s.processHeading}>{c["home.process_heading"]}</h2>
          <div className={s.stepsGrid}>
            {processSteps.map((step, i) => (
              <div key={i} className={s.step}>
                <span className={s.stepNum}>{String(i + 1).padStart(2, "0")}</span>
                <h4 className={s.stepTitle}>{step.title}</h4>
                <p className={s.stepText}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={s.cta}>
        <div className={s.ctaInner}>
          <h2 className={s.ctaHeading}>{c["home.cta_heading"]}</h2>
          <p className={s.ctaText}>{c["home.cta_text"]}</p>
          <Link href="/booking" className={s.ctaBtn}>
            Book en tid
          </Link>
        </div>
      </section>
    </>
  );
}
