"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navigation, siteName } from "@/lib/siteData";

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();
  const accountHref = session ? "/profile" : "/login";
  const accountLabel = session ? "Profile" : "Log in";

  return (
    <header className="nav" data-open={isMenuOpen ? "true" : "false"}>
      <div className="nav__ticker">
        <span>The SoleInsider release desk</span>
        <Link href="/calendar">See what drops next</Link>
      </div>

      <div className="nav__bar">
        <button
          aria-controls="primary-navigation"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="nav__toggle"
          onClick={() => setIsMenuOpen((open) => !open)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <Link className="nav__brand" href="/" aria-label={`${siteName} home`}>
          Sole<em>Insider</em>
        </Link>

        <nav className="nav__links" id="primary-navigation" aria-label="Primary">
          {navigation.map((item) => (
            <Link
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              href={item.href}
              key={item.href}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {/* The pill is hidden on small screens, so the drawer carries it. */}
          <Link
            className="nav__links-login"
            href={accountHref}
            onClick={() => setIsMenuOpen(false)}
          >
            {accountLabel}
          </Link>
        </nav>

        <div className="nav__actions">
          <Link className="nav__search" href="/search" aria-label="Search releases">
            <SearchIcon />
          </Link>
          <Link className="nav__cta" href="/app">
            Get the app
          </Link>
          <Link className="nav__login" href={accountHref}>
            {accountLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";

  return pathname === href || pathname.startsWith(`${href}/`);
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <line
        x1="16.5"
        y1="16.5"
        x2="21"
        y2="21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
