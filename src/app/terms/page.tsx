import type { Metadata } from "next";
import { buildMetadata, siteName } from "@/lib/siteData";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Use",
  description: `The terms that apply when you use the ${siteName} website and mobile app.`,
  path: "/terms",
});

const sections = [
  {
    heading: "Using the site",
    body: [
      `By browsing ${siteName} or using the mobile app you agree to these terms. If you do not agree, please stop using the service.`,
    ],
  },
  {
    heading: "Release information",
    body: [
      "Release dates, retail prices, style codes, and product details are gathered from brands, retailers, and public sources. Dates change frequently and launches are sometimes cancelled or moved without notice.",
      `${siteName} publishes this information for reference only and makes no guarantee that any release will happen as listed.`,
    ],
  },
  {
    heading: "Votes and comments",
    body: [
      "COP/DROP votes and comments are contributed by visitors. Do not post unlawful, abusive, or deliberately misleading content.",
      "We may remove contributions or restrict access where content breaks these terms or degrades the service for others.",
    ],
  },
  {
    heading: "Retailer and app store links",
    body: [
      "Links to retailers, raffles, and app stores are provided for convenience. Purchases, raffle entries, and downloads are transactions with those third parties, and their terms apply.",
    ],
  },
  {
    heading: "Content and trademarks",
    body: [
      `Editorial content, page design, and the ${siteName} name and logo belong to ${siteName}. Brand names and product imagery belong to their respective owners and appear here for identification and reporting.`,
    ],
  },
  {
    heading: "No warranty",
    body: [
      "The service is provided as is. To the extent permitted by law, we disclaim liability for losses arising from reliance on release information, missed drops, or interruptions to the service.",
    ],
  },
  {
    heading: "Changes",
    body: [
      "These terms may be updated. Continued use after an update means you accept the revised terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="editorial-home legal-page">
      <header className="ed-masthead">
        <p className="ed-cat">Legal</p>
        <h1>Terms of Use</h1>
        <p className="ed-deck">Effective July 21, 2026</p>
      </header>

      <article className="legal-body">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
    </main>
  );
}
