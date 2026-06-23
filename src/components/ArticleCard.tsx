import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/siteData";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="article-card">
      <Link href={`/articles/${article.slug}`} className="article-card__media">
        <Image
          src={article.image}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 33vw"
        />
        <span>{article.category}</span>
      </Link>
      <div className="article-card__body">
        <h2>
          <Link href={`/articles/${article.slug}`}>{article.title}</Link>
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
