import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { articles, buildMetadata, siteName, siteUrl } from "@/lib/siteData";

export const metadata: Metadata = buildMetadata({
  title: "Sneaker Stories",
  description:
    "Sneaker authentication guides, release strategy, resale market explainers, and culture stories from SoleInsider.",
  path: "/articles",
  image: articles[0]?.image,
});

export default function ArticlesPage() {
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
      url: `${siteUrl}/articles/${article.slug}`,
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
