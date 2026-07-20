import Image from "next/image";
import Link from "next/link";
import type { ArticleRecord } from "@/lib/dbArticles";

export function ArticleDetailView({ article }: { article: ArticleRecord }) {
  return (
    <main>
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
        {article.image ? (
          <Image
            src={article.image}
            alt=""
            width={1180}
            height={560}
            priority
            loading="eager"
          />
        ) : null}
        <div
          className="article-prose"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
      </article>
    </main>
  );
}
