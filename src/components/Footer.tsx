import Link from "next/link";
import TentIcon from "./TentIcon";
import s from "./Footer.module.scss";

const FOOTER_NAV = [
  { href: "/about", label: "Om" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Galleri" },
  { href: "/booking", label: "Booking" },
  { href: "/aftercare", label: "Aftercare" },
  { href: "/contact", label: "Kontakt" },
];

export default function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.brand}>
          <TentIcon size={40} variant="white" />
          <p className={s.brandName}>Falkvard Tattoo</p>
          <p className={s.tagline}>Tatoveringer med sjæl</p>
        </div>

        <nav className={s.nav}>
          <p className={s.navLabel}>Sider</p>
          {FOOTER_NAV.map((item) => (
            <Link key={item.href} href={item.href} className={s.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={s.info}>
          <p className={s.navLabel}>Studie</p>
          <p className={s.infoText}>Ramsherred 1</p>
          <p className={s.infoText}>5700 Svendborg</p>
          <p className={s.infoText} style={{ marginTop: 12 }}>
            Åbent efter aftale
          </p>
        </div>

        <div className={s.social}>
          <p className={s.navLabel}>Følg med</p>
          <a
            href="https://www.instagram.com/a_falkvard_tattoo/"
            target="_blank"
            rel="noopener noreferrer"
            className={s.socialLink}
          >
            Instagram
          </a>
          <a
            href="https://www.facebook.com/afalkvardtattoo/"
            target="_blank"
            rel="noopener noreferrer"
            className={s.socialLink}
          >
            Facebook
          </a>
        </div>
      </div>

      <div className={s.bottom}>
        <div className={s.bottomInner}>
          <p className={s.copy}>
            &copy; {new Date().getFullYear()} A Falkvard Tattoo. Alle
            rettigheder forbeholdes.
          </p>
          <Link href="/styleguide" className={s.styleguideLink}>
            Styleguide
          </Link>
        </div>
      </div>
    </footer>
  );
}
