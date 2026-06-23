import Link from "next/link";
import {
  appStoreUrl,
  googlePlayUrl,
  navigation,
  siteName,
} from "@/lib/siteData";

export function SiteFooter() {
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
        </section>
        <section>
          <h2>Brands</h2>
          {["Nike", "Jordan", "adidas", "Yeezy", "New Balance", "ASICS"].map(
            (brand) => (
              <Link href={`/?brand=${brand.toLowerCase()}`} key={brand}>
                {brand}
              </Link>
            ),
          )}
        </section>
        <section id="download-app">
          <h2>Mobile App</h2>
          <p>Release reminders, comments, COP/DROP voting, and product stories.</p>
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
