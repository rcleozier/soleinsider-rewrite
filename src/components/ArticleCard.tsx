import Link from "next/link";
import type { ArticleRecord } from "@/lib/dbArticles";

export function ArticleCard({ article }: { article: ArticleRecord }) {
  const href = article.legacyUrl || `/article/${article.slug}`;

  return (
    <article className="article-card">
      <Link href={href} className="article-card__media">
        {/* Legacy article exports can reference arbitrary historical CDN hosts. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.image}
          alt=""
        />
        <span>{article.category}</span>
      </Link>
      <div className="article-card__body">
        <h2>
          <Link href={href}>{article.title}</Link>
        </h2>
        <p>{article.deck}</p>
        <footer>
          <span>By {article.author}</span>
          <time dateTime={article.date}>
            {new Intl.DateTimeFormat("en", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(`${article.date}T12:00:00`))}
          </time>
        </footer>
      </div>
    </article>
  );
}
