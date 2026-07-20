import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleDetailView } from "@/components/ArticleDetailView";
import { getDbArticleBySlug, getDbArticles } from "@/lib/dbArticles";
import { buildMetadata, siteName, siteUrl } from "@/lib/siteData";

type LegacyArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const articles = await getDbArticles();

  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: LegacyArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getDbArticleBySlug(slug);

  if (!article) {
    return {};
  }

  return buildMetadata({
    title: article.title,
    description: article.deck,
    path: `/article/${article.slug}`,
    image: article.image,
  });
}

export default async function LegacyArticleDetailPage({
  params,
}: LegacyArticlePageProps) {
  const { slug } = await params;
  const article = await getDbArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.deck,
    image: article.image,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
    mainEntityOfPage: `${siteUrl}/article/${article.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleDetailView article={article} />
    </>
  );
}
