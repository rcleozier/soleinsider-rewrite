import Link from "next/link";
import { StoreBadges } from "@/components/StoreBadges";
import {
  appStoreUrl,
  googlePlayUrl,
  navigation,
  siteName,
} from "@/lib/siteData";

const brandLinks = [
  { href: "/nike-releases", label: "Nike" },
  { href: "/air-jordan-releases", label: "Jordan" },
  { href: "/adidas-releases", label: "adidas" },
  { href: "/yeezy-releases", label: "Yeezy" },
  { href: "/new-balance-releases", label: "New Balance" },
  { href: "/puma-releases", label: "Puma" },
  { href: "/asics-releases", label: "ASICS" },
  { href: "/off-white-releases", label: "Off-White" },
];

const categoryLinks = [
  { href: "/clothing", label: "Clothing" },
  { href: "/music", label: "Music" },
];

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <section className="footer__brand">
          <Link className="footer__mark" href="/">
            Sole<em>Insider</em>
          </Link>
          <p>
            Sneaker release dates, streetwear stories, and buyer guides for
            collectors who care about timing.
          </p>
          <Link className="footer__cta" href="/app">
            Get the app
          </Link>
          <div className="footer__stores">
            <a href={appStoreUrl}>iOS</a>
            <a href={googlePlayUrl}>Android</a>
          </div>
        </section>

        <nav className="footer__col" aria-label="Explore">
          <h2>Explore</h2>
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/releases-dates">All Releases</Link>
        </nav>

        <nav className="footer__col" aria-label="Brands">
          <h2>Brands</h2>
          {brandLinks.map((brand) => (
            <Link href={brand.href} key={brand.href}>
              {brand.label}
            </Link>
          ))}
        </nav>

        <nav className="footer__col" aria-label="Categories">
          <h2>Categories</h2>
          {categoryLinks.map((category) => (
            <Link href={category.href} key={category.href}>
              {category.label}
            </Link>
          ))}
        </nav>
      </div>

      <section className="footer__download" aria-labelledby="footer-download-title">
        <h2 id="footer-download-title">Download the SoleInsider app</h2>
        <StoreBadges />
      </section>

      <div className="footer__bar">
        <span>
          &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
        </span>
        <nav aria-label="Legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
