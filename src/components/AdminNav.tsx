"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./AdminNav.module.scss";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Bookings" },
  { href: "/admin/images", label: "Billeder" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={s.nav}>
      <div className={s.inner}>
        <Link href="/admin/dashboard" className={s.brand}>
          Falkvard Admin
        </Link>
        <div className={s.links}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${s.link} ${pathname === item.href ? s.active : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
