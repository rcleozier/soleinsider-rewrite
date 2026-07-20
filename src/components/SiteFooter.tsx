import Link from "next/link";
import {
  appStoreUrl,
  googlePlayUrl,
  navigation,
  siteName,
} from "@/lib/siteData";

export function SiteFooter() {
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

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <section>
          <Link className="brand-mark brand-mark--footer" href="/">
            <span>Sole</span>Insider
          </Link>
          <p>
            Sneaker release dates, streetwear stories, market notes, and buyer
            guides for collectors who care about timing.
          </p>
        </section>
        <section>
          <h2>Explore</h2>
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/releases-dates">All Releases</Link>
        </section>
        <section>
          <h2>Brands</h2>
          {brandLinks.map((brand) => (
            <Link href={brand.href} key={brand.href}>
              {brand.label}
            </Link>
          ))}
        </section>
        <section>
          <h2>Categories</h2>
          {categoryLinks.map((category) => (
            <Link href={category.href} key={category.href}>
              {category.label}
            </Link>
          ))}
        </section>
        <section id="download-app">
          <h2>Mobile App</h2>
          <p>Release reminders, comments, COP/DROP voting, and product stories.</p>
          <Link href="/download">Download page</Link>
          <div className="footer-app-links">
            <a href={appStoreUrl}>App Store</a>
            <a href={googlePlayUrl}>Google Play</a>
          </div>
        </section>
      </div>
      <div className="site-footer__bar">
        <span>Copyright 2026 {siteName}. All rights reserved.</span>
        <span>Privacy / Terms / Contact</span>
      </div>
    </footer>
  );
}
