import Link from "next/link";
import {
  appStoreUrl,
  googlePlayUrl,
  navigation,
  siteName,
} from "@/lib/siteData";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-topbar">
        <span>End of season release desk</span>
        <Link href="#upcoming-releases">See what drops next</Link>
      </div>
      <div className="site-header__inner">
        <button className="menu-button" aria-label="Open menu" type="button">
          <span />
          <span />
        </button>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="brand-mark" href="/" aria-label={`${siteName} home`}>
          <span>Sole</span>Insider
        </Link>
        <div className="store-links" aria-label="Download the SoleInsider app">
          <a href={appStoreUrl}>App Store</a>
          <a href={googlePlayUrl}>Google Play</a>
        </div>
      </div>
    </header>
  );
}
