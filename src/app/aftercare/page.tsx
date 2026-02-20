import Link from "next/link";
import s from "./page.module.scss";

const TATTOO_STEPS = [
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

const PIERCING_STEPS = [
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

const DONTS = [
  "Svømmehaller, badekar og sauna",
  "Direkte sollys og solarier",
  "Stram, gnidende tøj over tatoveringen",
  "At kradse eller pille i skorper",
  "Alkohol og blodfortyndende midler (24 timer efter)",
  "Dyrehår og støvede omgivelser",
];

export default function AftercarePage() {
  return (
    <>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1 className={s.heroHeading}>Efterpleje</h1>
          <p className={s.heroIntro}>
            God efterpleje er afgørende for et flot resultat. Her er din guide
            til at passe på din nye tatovering eller piercing.
          </p>
        </div>
      </section>

      {/* Tattoo Aftercare */}
      <section className={s.section}>
        <div className={s.sectionInner}>
          <h2 className={s.sectionTitle}>Tatovering efterpleje</h2>
          <div className={s.stepsGrid}>
            {TATTOO_STEPS.map((step) => (
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
          <h2 className={s.sectionTitle}>Undgå de første 2-4 uger</h2>
          <div className={s.dontGrid}>
            {DONTS.map((item) => (
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
          <h2 className={s.sectionTitle}>Piercing efterpleje</h2>
          <div className={s.stepsGrid}>
            {PIERCING_STEPS.map((step) => (
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
          <h2 className={s.ctaHeading}>Har du spørgsmål?</h2>
          <p className={s.ctaText}>
            Er du i tvivl om noget, er du altid velkommen til at kontakte mig.
          </p>
          <Link href="/contact" className={s.ctaBtn}>
            Kontakt mig
          </Link>
        </div>
      </section>
    </>
  );
}
