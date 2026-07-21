import type { Metadata } from "next";
import Link from "next/link";
import { StoreBadges } from "@/components/StoreBadges";
import {
  appStoreUrl,
  buildMetadata,
  googlePlayUrl,
  siteName,
  siteUrl,
} from "@/lib/siteData";

export const metadata: Metadata = buildMetadata({
  title: "Get the SoleInsider App",
  description:
    "Download SoleInsider for iOS and Android: sneaker release reminders, COP/DROP voting, comments, product stories, and the full release calendar.",
  path: "/app",
});

const features = [
  {
    title: "Drop reminders that actually land",
    copy: "Set an alert on any release and get a push before it goes live \u2014 not an email you read the next morning.",
  },
  {
    title: "COP/DROP, live",
    copy: "See how collectors are voting on a shoe before you commit, and cast your own vote in a tap.",
  },
  {
    title: "The whole archive, offline",
    copy: "Twenty-four thousand products with release dates, retail prices, style codes, and full galleries.",
  },
  {
    title: "Favorites that sync",
    copy: "Star a release on the web and it is waiting on your phone, with a reminder already attached.",
  },
  {
    title: "Comments and the room",
    copy: "Read what people are saying about a pair on release morning, and add your own take.",
  },
  {
    title: "On this day",
    copy: "Every anniversary, every retro, every drop that landed on today\u2019s date since the archive began.",
  },
];

const stats = [
  { value: "24,000+", label: "Products archived" },
  { value: "Daily", label: "Release desk updates" },
  { value: "Free", label: "On iOS and Android" },
];

const steps = [
  {
    step: "01",
    title: "Install and pick your brands",
    copy: "Jordan, Nike, adidas, New Balance \u2014 tell the app what you actually chase.",
  },
  {
    step: "02",
    title: "Star the releases you want",
    copy: "Every favorite becomes a countdown with a reminder attached.",
  },
  {
    step: "03",
    title: "Get the push before it drops",
    copy: "Arrive at the raffle or the retailer on time, with the style code in hand.",
  },
];

export default function AppPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${siteName} Sneaker Releases`,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "iOS, Android",
    url: `${siteUrl}/app`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <main className="editorial-home app-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="ed-masthead">
        <p className="ed-cat">Mobile app</p>
        <h1>Never miss the next sneaker drop.</h1>
        <p className="ed-deck">
          SoleInsider is free on iOS and Android. Track release dates, save
          product details, vote COP/DROP, and keep the calendar in your pocket.
        </p>
      </header>

      <section className="app-store-row" aria-label="Download the app">
        <StoreBadges className="store-badges--large" />
      </section>

      <section className="app-stats" aria-label="At a glance">
        {stats.map((stat) => (
          <article key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="app-features" aria-label="App features">
        {features.map((feature) => (
          <article key={feature.title}>
            <h2>{feature.title}</h2>
            <p>{feature.copy}</p>
          </article>
        ))}
      </section>

      <section className="app-steps" aria-label="How it works">
        <h2 className="ed-column__title">How it works</h2>
        <div className="app-steps__grid">
          {steps.map((item) => (
            <article key={item.step}>
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="app-cta-band">
        <div>
          <h2>The next drop is already on the calendar.</h2>
          <p>Free on iOS and Android. No account required to start tracking.</p>
        </div>
        <div className="app-cta-band__links">
          <a href={appStoreUrl}>App Store</a>
          <a href={googlePlayUrl}>Google Play</a>
        </div>
      </section>

      <section className="app-linkback">
        <p className="ed-cat">Prefer the web?</p>
        <h2>Browse the full SoleInsider release archive.</h2>
        <Link className="ed-more" href="/calendar">
          Open the calendar
        </Link>
      </section>
    </main>
  );
}


