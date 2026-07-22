import Link from "next/link";
import type { ArticleRecord } from "@/lib/dbArticles";

export function ArticleDetailView({ article }: { article: ArticleRecord }) {
  const publishedDate = new Date(`${article.date}T12:00:00`);
  const formattedDate = Number.isNaN(publishedDate.getTime())
    ? null
    : new Intl.DateTimeFormat("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(publishedDate);

  return (
    <main className="editorial-home article-page">
      <article>
        <header className="ed-masthead article-page__head">
          <p className="ed-cat">
            <Link href="/articles">← Stories</Link>
            <span aria-hidden="true">·</span>
            {article.category}
          </p>
          <h1>{article.title}</h1>
          {article.deck ? <p className="ed-deck">{article.deck}</p> : null}
          <p className="ed-byline">
            By {article.author}
            {formattedDate ? (
              <>
                {" · "}
                <time dateTime={article.date}>{formattedDate}</time>
              </>
            ) : null}
          </p>
        </header>

        {article.image ? (
          <figure className="article-page__cover">
            {/* Legacy article covers point at arbitrary historical CDN hosts,
                so these stay outside next/image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.image} alt="" loading="eager" />
          </figure>
        ) : null}

        <div
          className="article-page__prose"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />

        <footer className="article-page__foot">
          <Link className="ed-more" href="/articles">
            More stories
          </Link>
        </footer>
      </article>
    </main>
  );
}
