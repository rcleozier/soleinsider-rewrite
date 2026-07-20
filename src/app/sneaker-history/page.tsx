import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { getDbArticles } from "@/lib/dbArticles";
import { getAllReleases } from "@/lib/legacyMobileApi";
import {
  articles,
  buildMetadata,
  cleanHtmlContent,
  formatReleaseDate,
  getBrandName,
  getReleaseImage,
  getReleaseUrl,
  siteName,
  siteUrl,
} from "@/lib/siteData";

export const metadata: Metadata = buildMetadata({
  title: "Sneaker History",
  description:
    "Sneaker history, Air Jordan stories, Nike release archives, Yeezy origins, and product timelines from SoleInsider.",
  path: "/sneaker-history",
  image: articles[0]?.image,
});

export default async function SneakerHistoryPage() {
  const releases = getAllReleases();
  const dbArticles = await getDbArticles(12);
  const featuredReleases = releases.slice(0, 6);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteName} Sneaker History`,
    url: `${siteUrl}/sneaker-history`,
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="subpage-hero">
        <p className="kicker">Sneaker history</p>
        <h1>Archive notes for the drops that shaped the calendar.</h1>
        <p>
          A release-focused history page for Jordan, Nike, adidas, Yeezy, and
          the stories collectors search for long after launch day.
        </p>
      </section>

      <section className="content-band">
        <div className="history-timeline">
          {featuredReleases.map((release) => (
            <article key={release.id}>
              <Image
                src={getReleaseImage(release)}
                alt=""
                width={420}
                height={336}
              />
              <div>
                <p className="kicker">{getBrandName(release)}</p>
                <h2>
                  <Link href={getReleaseUrl(release)}>{release.name}</Link>
                </h2>
                <p>
                  {cleanHtmlContent(release.content) ||
                    `${release.name} is archived with its release date, SKU, retail price, and mobile app voting signals.`}
                </p>
                <footer>
                  {formatReleaseDate(release)} / SKU {release.sku || "TBA"}
                </footer>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-band content-band--light">
        <div className="section-heading">
          <p className="kicker">Guides</p>
          <h2>Authentication and collector context.</h2>
          <p>
            Evergreen articles keep the archive searchable for buyers comparing
            shape, materials, tags, and market behavior.
          </p>
        </div>
        <div className="article-grid article-grid--wide">
          {dbArticles.map((article) => (
            <ArticleCard article={article} key={article.slug} />
          ))}
        </div>
      </section>
    </main>
  );
}
