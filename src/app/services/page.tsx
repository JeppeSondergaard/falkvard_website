import Link from "next/link";
import Image from "next/image";
import { getContentBulk } from "@/lib/content";
import s from "./page.module.scss";

export const dynamic = "force-dynamic";

const STYLES = [
  {
    name: "Nordisk",
    desc: "Vikingeinspirerede mønstre, runer og keltiske knuder",
    image: "/styles/style-nordisk.jpg",
  },
  {
    name: "Ornamental",
    desc: "Geometriske og symmetriske designs med fine detaljer",
    image: "/styles/style-ornamental.jpg",
  },
  {
    name: "Dark Art",
    desc: "Mørke, atmosfæriske motiver med dybde og stemning",
    image: "/styles/style-darkart.jpg",
  },
  {
    name: "Blomster",
    desc: "Botaniske designs fra fine linjer til bold realism",
    image: "/styles/style-blomster.jpg",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Forberedelse",
    text: "Sov godt, spis inden og undgå alkohol 24 timer før din session.",
  },
  {
    num: "02",
    title: "Design",
    text: "Vi gennemgår dit design sammen og sikrer, det er præcist som du vil have det.",
  },
  {
    num: "03",
    title: "Tatovering",
    text: "I et roligt, sterilt miljø med din musik og god stemning.",
  },
  {
    num: "04",
    title: "Efterpleje",
    text: "Du får en grundig vejledning i pleje af din nye tatovering.",
  },
];

export default function ServicesPage() {
  const c = getContentBulk([
    "services.hero_title",
    "services.hero_sub",
    "services.piercing_text",
    "services.price_consultation",
    "services.price_minimum",
    "services.price_hourly",
    "services.price_piercing",
    "services.price_note",
    "services.cta_heading",
    "services.cta_text",
  ]);

  return (
    <>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <p className={s.sectionLabel}>Services</p>
          <h1 className={s.heroTitle}>{c["services.hero_title"]}</h1>
          <p className={s.heroSub}>{c["services.hero_sub"]}</p>
        </div>
      </section>

      {/* Tattoo Styles */}
      <section className={s.section}>
        <div className={s.container}>
          <p className={s.sectionLabel}>Tatovering</p>
          <h2 className={s.sectionTitle}>Stilarter</h2>
          <div className={s.stylesGrid}>
            {STYLES.map((style) => (
              <div key={style.name} className={s.styleCard}>
                <div className={s.styleCardImageWrap}>
                  <Image
                    src={style.image}
                    alt={`${style.name} tatoveringsstil`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={s.styleCardImage}
                  />
                </div>
                <div className={s.styleCardContent}>
                  <h3 className={s.styleCardTitle}>{style.name}</h3>
                  <p className={s.styleCardText}>{style.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Piercing */}
      <section className={s.sectionAlt}>
        <div className={s.container}>
          <p className={s.sectionLabel}>Piercing</p>
          <h2 className={s.sectionTitle}>Professionel piercing</h2>
          <div className={s.piercingCard}>
            <p className={s.piercingText}>{c["services.piercing_text"]}</p>
            <Link href="/aftercare" className={s.ghostLink}>
              Læs om piercing efterpleje
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={s.section}>
        <div className={s.container}>
          <p className={s.sectionLabel}>Priser</p>
          <h2 className={s.sectionTitle}>Prisoverslag</h2>
          <div className={s.pricingCard}>
            <div className={s.priceRow}>
              <span className={s.priceLabel}>Konsultation</span>
              <span className={s.priceValue}>{c["services.price_consultation"]}</span>
            </div>
            <div className={s.priceRow}>
              <span className={s.priceLabel}>Minimum</span>
              <span className={s.priceValue}>{c["services.price_minimum"]}</span>
            </div>
            <div className={s.priceRow}>
              <span className={s.priceLabel}>Timepris</span>
              <span className={s.priceValue}>{c["services.price_hourly"]}</span>
            </div>
            <div className={s.priceRow}>
              <span className={s.priceLabel}>Piercing fra</span>
              <span className={s.priceValue}>{c["services.price_piercing"]}</span>
            </div>
            <p className={s.priceNote}>{c["services.price_note"]}</p>
          </div>
        </div>
      </section>

      {/* Session Info */}
      <section className={s.sectionAlt}>
        <div className={s.container}>
          <p className={s.sectionLabel}>Din session</p>
          <h2 className={s.sectionTitle}>Hvad du kan forvente</h2>
          <div className={s.stepsGrid}>
            {STEPS.map((step) => (
              <div key={step.num} className={s.step}>
                <span className={s.stepNum}>{step.num}</span>
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
          <h2 className={s.ctaHeading}>{c["services.cta_heading"]}</h2>
          <p className={s.ctaText}>{c["services.cta_text"]}</p>
          <Link href="/booking" className={s.ctaBtn}>
            Book en tid
          </Link>
        </div>
      </section>
    </>
  );
}
