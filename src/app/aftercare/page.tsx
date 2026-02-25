import Link from "next/link";
import { getContentBulk } from "@/lib/content";
import s from "./page.module.scss";

export const dynamic = "force-dynamic";

type StepItem = { title: string; text: string };

const DEFAULT_TATTOO_STEPS: StepItem[] = [
  {
    title: "Dag 1-3",
    text: "Hold forbindingen på i 2-4 timer. Vask forsigtigt med lunkent vand og parfumefri sæbe. Dup tør med rent papir – gnid ikke.",
  },
  {
    title: "Uge 1-2",
    text: "Smør tynt lag af efterplejeproduktet 2-3 gange dagligt. Undgå at kradse eller pille i skorperne. Hold tatoveringen ren og tør.",
  },
  {
    title: "Uge 3-4",
    text: "Huden kan begynde at skalle – det er helt normalt. Fortsæt med at fugte, men lad huden ånde. Undgå sol, bassiner og havet.",
  },
  {
    title: "Fremover",
    text: "Brug altid solcreme (SPF 30+) på din tatovering i solen. Det holder farverne stærke og linjerne skarpe i årevis.",
  },
];

const DEFAULT_PIERCING_STEPS: StepItem[] = [
  {
    title: "De første uger",
    text: "Rens med saltvand (0.9%) morgen og aften. Undgå at røre piercingen med beskidte hænder. Lad smykket sidde – drej det ikke.",
  },
  {
    title: "Helingsperiode",
    text: "De fleste piercinger heler i løbet af 6-12 uger (brusk kan tage op til 6 måneder). Undgå at skifte smykke for tidligt.",
  },
  {
    title: "Tegn på problemer",
    text: "Hævelse og rødme de første dage er normalt. Kontakt os hvis du oplever vedvarende smerte, grøn/gul væske eller usædvanlig hævelse.",
  },
];

const DEFAULT_DONTS: string[] = [
  "Svømmehaller, badekar og sauna",
  "Direkte sollys og solarier",
  "Stram, gnidende tøj over tatoveringen",
  "At kradse eller pille i skorper",
  "Alkohol og blodfortyndende midler (24 timer efter)",
  "Dyrehår og støvede omgivelser",
];

export default function AftercarePage() {
  const c = getContentBulk([
    "aftercare.hero_heading",
    "aftercare.hero_intro",
    "aftercare.tattoo_heading",
    "aftercare.tattoo_steps",
    "aftercare.donts_heading",
    "aftercare.donts_items",
    "aftercare.piercing_heading",
    "aftercare.piercing_steps",
    "aftercare.cta_heading",
    "aftercare.cta_text",
    "aftercare.cta_button_label",
  ]);

  function parseSteps(raw: string, fallback: StepItem[]): StepItem[] {
    try {
      const parsed = JSON.parse(raw);
      if (
        Array.isArray(parsed) &&
        parsed.every(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof (item as { title?: unknown }).title === "string" &&
            typeof (item as { text?: unknown }).text === "string"
        )
      ) {
        return parsed as StepItem[];
      }
    } catch {
      // Fallback when JSON content is invalid or malformed
    }
    return fallback;
  }

  function parseStringList(raw: string, fallback: string[]): string[] {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
        return parsed;
      }
    } catch {
      // Fallback when JSON content is invalid or malformed
    }
    return fallback;
  }

  const tattooSteps = parseSteps(c["aftercare.tattoo_steps"], DEFAULT_TATTOO_STEPS);
  const piercingSteps = parseSteps(c["aftercare.piercing_steps"], DEFAULT_PIERCING_STEPS);
  const donts = parseStringList(c["aftercare.donts_items"], DEFAULT_DONTS);

  return (
    <>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1 className={s.heroHeading}>{c["aftercare.hero_heading"]}</h1>
          <p className={s.heroIntro}>{c["aftercare.hero_intro"]}</p>
        </div>
      </section>

      {/* Tattoo Aftercare */}
      <section className={s.section}>
        <div className={s.sectionInner}>
          <h2 className={s.sectionTitle}>{c["aftercare.tattoo_heading"]}</h2>
          <div className={s.stepsGrid}>
            {tattooSteps.map((step) => (
              <div key={step.title} className={s.stepCard}>
                <h3 className={s.stepTitle}>{step.title}</h3>
                <p className={s.stepText}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Don'ts */}
      <section className={s.sectionAlt}>
        <div className={s.sectionInner}>
          <h2 className={s.sectionTitle}>{c["aftercare.donts_heading"]}</h2>
          <div className={s.dontGrid}>
            {donts.map((item) => (
              <div key={item} className={s.dontItem}>
                <span className={s.dontX}>&times;</span>
                <span className={s.dontText}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Piercing Aftercare */}
      <section className={s.section}>
        <div className={s.sectionInner}>
          <h2 className={s.sectionTitle}>{c["aftercare.piercing_heading"]}</h2>
          <div className={s.stepsGrid}>
            {piercingSteps.map((step) => (
              <div key={step.title} className={s.stepCard}>
                <h3 className={s.stepTitle}>{step.title}</h3>
                <p className={s.stepText}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={s.cta}>
        <div className={s.ctaInner}>
          <h2 className={s.ctaHeading}>{c["aftercare.cta_heading"]}</h2>
          <p className={s.ctaText}>{c["aftercare.cta_text"]}</p>
          <Link href="/contact" className={s.ctaBtn}>
            {c["aftercare.cta_button_label"]}
          </Link>
        </div>
      </section>
    </>
  );
}
