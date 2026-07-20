import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { getDbArticles } from "@/lib/dbArticles";
import { articles as fallbackArticles, buildMetadata, siteName, siteUrl } from "@/lib/siteData";

export const metadata: Metadata = buildMetadata({
  title: "Sneaker Stories",
  description:
    "Sneaker authentication guides, release strategy, resale market explainers, and culture stories from SoleInsider.",
  path: "/articles",
  image: fallbackArticles[0]?.image,
});

export default async function ArticlesPage() {
  const articles = await getDbArticles();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${siteName} Sneaker Stories`,
    url: `${siteUrl}/articles`,
    blogPost: articles.map((article) => ({
      "@type": "BlogPosting",
      headline: article.title,
      description: article.deck,
      datePublished: article.date,
      author: {
        "@type": "Person",
        name: article.author,
      },
      image: article.image,
      url: `${siteUrl}${article.legacyUrl}`,
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="subpage-hero">
        <p className="kicker">Sneaker stories</p>
        <h1>Authentication, resale, and release strategy.</h1>
        <p>
          Guides for spotting fakes, reading market signals, and understanding
          the releases that shape sneaker culture.
        </p>
      </section>

      <section className="content-band">
        <div className="article-grid article-grid--wide">
          {articles.map((article) => (
            <ArticleCard article={article} key={article.slug} />
          ))}
        </div>
      </section>
    </main>
  );
}
