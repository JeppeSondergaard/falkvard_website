"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TentIcon from "./TentIcon";
import s from "./Header.module.scss";

const NAV_ITEMS = [
  { href: "/", label: "Hjem" },
  { href: "/about", label: "Om" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Galleri" },
  { href: "/aftercare", label: "Aftercare" },
  { href: "/contact", label: "Kontakt" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleTheme = () => {
    const html = document.documentElement;
    const current = html.getAttribute("data-theme");
    html.setAttribute("data-theme", current === "light" ? "dark" : "light");
  };

  return (
    <header className={s.header}>
      <div className={s.inner}>
        <Link href="/" className={s.logoLink}>
          <TentIcon size={28} variant="white" />
          <span className={s.logoText}>Falkvard Tattoo</span>
        </Link>

        <nav className={`${s.nav} ${menuOpen ? s.navOpen : ""}`}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${s.navLink} ${pathname === item.href ? s.navLinkActive : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/booking"
            className={s.navCta}
            onClick={() => setMenuOpen(false)}
          >
            Book en tid
          </Link>
        </nav>

        <div className={s.actions}>
          <button
            className={s.themeBtn}
            onClick={toggleTheme}
            aria-label="Skift tema"
          >
            <span className={s.themeSun}>&#9788;</span>
            <span className={s.themeMoon}>&#9789;</span>
          </button>

          <button
            className={`${s.burger} ${menuOpen ? s.burgerOpen : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
