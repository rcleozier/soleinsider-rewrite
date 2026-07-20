import type { Metadata } from "next";
import Link from "next/link";
import {
  appStoreUrl,
  buildMetadata,
  googlePlayUrl,
  siteName,
  siteUrl,
} from "@/lib/siteData";

export const metadata: Metadata = buildMetadata({
  title: "Download the SoleInsider App",
  description:
    "Get SoleInsider sneaker release reminders, COP/DROP voting, comments, product stories, and calendar alerts on iOS and Android.",
  path: "/download",
});

export default function DownloadPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${siteName} Sneaker Releases`,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "iOS, Android",
    url: `${siteUrl}/download`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="download-hero">
        <div>
          <p className="kicker">Mobile app</p>
          <h1>Never miss the next sneaker drop.</h1>
          <p>
            Track release dates, save product details, vote COP/DROP, read
            comments, and keep the SoleInsider calendar with you.
          </p>
          <div className="download-actions">
            <a href={appStoreUrl}>App Store</a>
            <a href={googlePlayUrl}>Google Play</a>
          </div>
        </div>
        <div className="download-panel" aria-label="SoleInsider app features">
          <span>DROP ALERTS</span>
          <strong>00 : 06 : 22</strong>
          <p>Countdowns, reminders, product images, style codes, retail prices, and community voting.</p>
        </div>
      </section>

      <section className="content-band download-features">
        {[
          ["Release calendar", "Browse upcoming drops by date and jump into local product pages."],
          ["COP/DROP voting", "See collector sentiment and cast repeat votes just like the legacy app."],
          ["Product stories", "Open image slideshows, comments, related products, and SKU details."],
        ].map(([title, copy]) => (
          <article key={title}>
            <p className="kicker">{title}</p>
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="content-band download-linkback">
        <p className="kicker">Prefer the web?</p>
        <h2>Explore the full SoleInsider release archive.</h2>
        <Link className="homepage-primary-link" href="/releases-dates">
          View all releases
        </Link>
      </section>
    </main>
  );
}
