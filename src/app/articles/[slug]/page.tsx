import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { articles, buildMetadata, siteName, siteUrl } from "@/lib/siteData";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);

  if (!article) {
    return {};
  }

  return buildMetadata({
    title: article.title,
    description: article.deck,
    path: `/articles/${article.slug}`,
    image: article.image,
  });
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);

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
    mainEntityOfPage: `${siteUrl}/articles/${article.slug}`,
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="article-detail">
        <header>
          <Link href="/articles" className="text-link">
            Stories
          </Link>
          <p className="kicker">{article.category}</p>
          <h1>{article.title}</h1>
          <p>{article.deck}</p>
          <div className="article-byline">
            <span>By {article.author}</span>
            <time dateTime={article.date}>
              {new Intl.DateTimeFormat("en", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }).format(new Date(`${article.date}T12:00:00`))}
            </time>
          </div>
        </header>
        <Image
          src={article.image}
          alt=""
          width={1180}
          height={560}
          priority
          loading="eager"
        />
        <div className="article-prose">
          {article.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </main>
  );
}
