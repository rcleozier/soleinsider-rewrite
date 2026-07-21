import type { Metadata } from "next";
import Link from "next/link";
import type { ArticleRecord } from "@/lib/dbArticles";
import { getDbArticles } from "@/lib/dbArticles";
import { buildMetadata, siteName, siteUrl } from "@/lib/siteData";

export const metadata: Metadata = buildMetadata({
  title: "Sneaker Stories",
  description:
    "Sneaker authentication guides, release strategy, resale market explainers, and culture stories from SoleInsider.",
  path: "/articles",
});

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const articles = await getDbArticles();
  const [lead, ...rest] = articles;
  const secondary = rest.slice(0, 4);
  const feed = rest.slice(4);
  const categories = getCategories(articles);
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
    <main className="editorial-home articles-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="ed-masthead">
        <p className="ed-cat">Sneaker stories</p>
        <h1>Authentication, resale, and release strategy.</h1>
        <p className="ed-deck">
          Guides for spotting fakes, reading market signals, and understanding
          the releases that shape sneaker culture.
        </p>
      </header>

      {lead ? (
        <section className="ed-mosaic" aria-label="Featured stories">
          <article className="ed-lead">
            <Link href={articleHref(lead)} className="ed-lead__media">
              <ArticleImage article={lead} priority />
            </Link>
            <div className="ed-lead__body">
              <p className="ed-cat">{lead.category || "Stories"}</p>
              <h2>
                <Link href={articleHref(lead)}>{lead.title}</Link>
              </h2>
              <p className="ed-deck">{lead.deck}</p>
              <p className="ed-byline">{byline(lead)}</p>
            </div>
          </article>

          <div className="ed-mosaic__side">
            {secondary.slice(0, 2).map((article) => (
              <article className="ed-side" key={article.slug}>
                <Link href={articleHref(article)} className="ed-side__media">
                  <ArticleImage article={article} />
                </Link>
                <p className="ed-cat">{article.category || "Stories"}</p>
                <h3>
                  <Link href={articleHref(article)}>{article.title}</Link>
                </h3>
                <p className="ed-byline">{byline(article)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {secondary.length > 2 ? (
        <section className="ed-strip" aria-label="More stories">
          {secondary.slice(2).map((article) => (
            <article key={article.slug}>
              <Link href={articleHref(article)} className="ed-strip__media">
                <ArticleImage article={article} />
              </Link>
              <p className="ed-cat">{article.category || "Stories"}</p>
              <h3>
                <Link href={articleHref(article)}>{article.title}</Link>
              </h3>
              <p className="ed-byline">{byline(article)}</p>
            </article>
          ))}
        </section>
      ) : null}

      <div className="ed-body ed-body--articles">
        <section className="ed-column" aria-labelledby="articles-feed-title">
          <h2 className="ed-column__title" id="articles-feed-title">
            All stories
          </h2>
          <div className="ed-feed">
            {feed.map((article) => (
              <article className="ed-row" key={article.slug}>
                <div className="ed-row__body">
                  <p className="ed-cat">{article.category || "Stories"}</p>
                  <h3>
                    <Link href={articleHref(article)}>{article.title}</Link>
                  </h3>
                  <p className="ed-deck">{article.deck}</p>
                  <p className="ed-byline">{byline(article)}</p>
                </div>
                <Link href={articleHref(article)} className="ed-row__media">
                  <ArticleImage article={article} />
                </Link>
              </article>
            ))}
          </div>
          {!articles.length ? (
            <p className="ed-deck">No stories published yet.</p>
          ) : null}
        </section>

        <aside className="ed-rail" aria-label="Story sections">
          <div className="ed-rail__inner">
            <section className="ed-module">
              <h2>Sections</h2>
              <ol className="ed-ranking">
                {categories.map((category, index) => (
                  <li key={category.name}>
                    <span>{index + 1}</span>
                    <strong>{category.name}</strong>
                    <em>{category.count}</em>
                  </li>
                ))}
              </ol>
            </section>

            <section className="ed-module">
              <h2>Release desk</h2>
              <ul className="ed-calendar">
                <li>
                  <Link href="/calendar">Release calendar</Link>
                  <span>Every confirmed drop by date</span>
                </li>
                <li>
                  <Link href="/sports">Sports</Link>
                  <span>Scores, schedules, and the shoes on court</span>
                </li>
                <li>
                  <Link href="/on-this-day">On this day</Link>
                  <span>What released on today&apos;s date</span>
                </li>
              </ul>
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ArticleImage({
  article,
  priority,
}: {
  article: ArticleRecord;
  priority?: boolean;
}) {
  // Legacy article covers point at arbitrary historical CDN hosts, so these
  // stay outside next/image optimization.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={article.image} alt="" loading={priority ? "eager" : "lazy"} />;
}

function articleHref(article: ArticleRecord) {
  return article.legacyUrl || `/article/${article.slug}`;
}

function byline(article: ArticleRecord) {
  const date = new Date(`${article.date}T12:00:00`);
  const formatted = Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);

  return formatted ? `By ${article.author} · ${formatted}` : `By ${article.author}`;
}

function getCategories(articles: ArticleRecord[]) {
  const counts = new Map<string, number>();

  for (const article of articles) {
    const name = article.category || "Stories";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return Array.from(counts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 8);
}
