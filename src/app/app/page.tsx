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
        <a className="app-store-card" href={appStoreUrl}>
          <AppleIcon />
          <span>
            <em>Download on the</em>
            <strong>App Store</strong>
          </span>
        </a>
        <a className="app-store-card" href={googlePlayUrl}>
          <PlayIcon />
          <span>
            <em>Get it on</em>
            <strong>Google Play</strong>
          </span>
        </a>
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

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="currentColor">
      <path d="M16.4 12.8c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.6 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.6.7 2.8.7 1.2 0 1.9-1 2.6-2 .8-1.2 1.2-2.3 1.2-2.4-.1 0-2.2-.9-2.2-3.4zM14.3 6c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="currentColor">
      <path d="M3.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1 9.3-9.3v-.2L3.6 2.3zM16.4 15.3l-3.1-3.1v-.2l3.1-3.1 3.7 2.1c1 .6 1 1.6 0 2.2l-3.7 2.1zM15.5 15.9L12.3 12.7l-9.2 9.3c.3.4.9.4 1.6 0l10.8-6.1M15.5 8.1L4.7 2c-.7-.4-1.3-.4-1.6 0l9.2 9.3 3.2-3.2z" />
    </svg>
  );
}
