import Link from "next/link";
import Image from "next/image";
import { getContentBulk } from "@/lib/content";
import s from "./page.module.scss";

export const dynamic = "force-dynamic";

export default function AboutPage() {
  const c = getContentBulk([
    "about.hero_heading",
    "about.hero_intro",
    "about.profile_image",
    "about.artist_heading",
    "about.artist_text",
    "about.quote_text",
    "about.value_1_title",
    "about.value_1_desc",
    "about.value_2_title",
    "about.value_2_desc",
    "about.value_3_title",
    "about.value_3_desc",
    "about.booking_heading",
    "about.booking_steps",
    "about.cta_heading",
  ]);

  let bookingSteps: string[] = [];
  try {
    bookingSteps = JSON.parse(c["about.booking_steps"]);
  } catch { /* use empty */ }

  return (
    <>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1 className={s.heroHeading}>{c["about.hero_heading"]}</h1>
          <p className={s.heroIntro}>{c["about.hero_intro"]}</p>
        </div>
      </section>

      {/* Artist Story */}
      <section className={s.artistStory}>
        <div className={s.artistStoryInner}>
          <div className={s.artistImagePlaceholder}>
            <Image
              src={c["about.profile_image"]}
              alt="Andrea Falkvard"
              width={320}
              height={320}
              unoptimized
              style={{ objectFit: "cover", width: "100%", height: "100%", borderRadius: "8px" }}
            />
          </div>
          <div className={s.artistStoryContent}>
            <h2 className={s.artistStoryHeading}>{c["about.artist_heading"]}</h2>
            <p className={s.artistStoryText}>{c["about.artist_text"]}</p>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className={s.philosophy}>
        <div className={s.philosophyInner}>
          <blockquote className={s.quoteBlock}>
            <p className={s.quoteText}>
              &ldquo;{c["about.quote_text"]}&rdquo;
            </p>
          </blockquote>
          <div className={s.valuesGrid}>
            <div className={s.valueItem}>
              <h3 className={s.valueTitle}>{c["about.value_1_title"]}</h3>
              <p className={s.valueDesc}>{c["about.value_1_desc"]}</p>
            </div>
            <div className={s.valueItem}>
              <h3 className={s.valueTitle}>{c["about.value_2_title"]}</h3>
              <p className={s.valueDesc}>{c["about.value_2_desc"]}</p>
            </div>
            <div className={s.valueItem}>
              <h3 className={s.valueTitle}>{c["about.value_3_title"]}</h3>
              <p className={s.valueDesc}>{c["about.value_3_desc"]}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Private Studio */}
      <section className={s.privateStudio}>
        <div className={s.privateStudioInner}>
          <h2 className={s.privateStudioHeading}>{c["about.booking_heading"]}</h2>
          <ul className={s.benefitsList}>
            {bookingSteps.map((step, i) => (
              <li key={i} className={s.benefitItem}>
                <span className={s.benefitNum}>{i + 1}</span>
                <span className={s.benefitText}>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className={s.cta}>
        <div className={s.ctaInner}>
          <h2 className={s.ctaHeading}>{c["about.cta_heading"]}</h2>
          <Link href="/booking" className={s.ctaBtn}>
            Book en tid
          </Link>
        </div>
      </section>
    </>
  );
}
