import type { Metadata } from "next";
import { buildMetadata, siteName } from "@/lib/siteData";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: `How ${siteName} collects, uses, and protects information across the website and mobile app.`,
  path: "/privacy",
});

const sections = [
  {
    heading: "What we collect",
    body: [
      `${siteName} collects the information you provide directly, such as an email address used for release reminders, and limited technical information sent automatically by your browser or device, including IP address, device type, and pages viewed.`,
      "COP/DROP votes and comments are stored with the product they belong to so counts and conversations persist between visits.",
    ],
  },
  {
    heading: "How we use it",
    body: [
      "Information is used to deliver release reminders you have asked for, to keep release and product data accurate, to measure which pages are useful, and to prevent abuse of voting and comments.",
      "We do not sell personal information.",
    ],
  },
  {
    heading: "Cookies and analytics",
    body: [
      "The site uses cookies and similar storage to keep the interface working and to understand aggregate traffic patterns. You can block cookies in your browser settings; core browsing will continue to work.",
    ],
  },
  {
    heading: "Third parties",
    body: [
      "Product imagery, retailer links, and app store links may take you to services operated by others. Their handling of your information is governed by their own policies, not this one.",
    ],
  },
  {
    heading: "Your choices",
    body: [
      "You can unsubscribe from release reminders at any time using the link in any reminder email, or by removing notification permissions in the mobile app.",
      `To request deletion of information associated with you, contact ${siteName} through the mobile app support screen.`,
    ],
  },
  {
    heading: "Changes",
    body: [
      "If this policy changes materially, the updated version will be posted on this page with a new effective date.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="editorial-home legal-page">
      <header className="ed-masthead">
        <p className="ed-cat">Legal</p>
        <h1>Privacy Policy</h1>
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
