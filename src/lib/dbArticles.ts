import { prisma } from "@/lib/prisma";
import type { Article } from "@/lib/siteData";

const allowedTags = new Set([
  "a",
  "br",
  "em",
  "h2",
  "h3",
  "hr",
  "img",
  "li",
  "ol",
  "p",
  "strong",
  "ul",
]);

type DbArticle = {
  id: number;
  title: string | null;
  content: string | null;
  cover: string | null;
  slug: string | null;
  keywords: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type ArticleRecord = Article & {
  id: string;
  html: string;
  legacyUrl: string;
  keywords: string[];
};

export async function getDbArticles(limit = 120, offset = 0) {
  try {
    const rows = await prisma.article.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      skip: offset,
    });

    const mapped = rows.map(mapDbArticle).filter((article) => article.slug);

    return mapped;
  } catch (error) {
    console.warn("Unable to read DB articles.", error);
    return [];
  }
}

export async function getDbArticleCount() {
  try {
    return await prisma.article.count();
  } catch (error) {
    console.warn("Unable to count DB articles.", error);
    return 0;
  }
}

export async function getDbArticleBySlug(slug: string) {
  try {
    const row = await prisma.article.findFirst({
      where: {
        slug,
      },
    });

    return row ? mapDbArticle(row) : null;
  } catch (error) {
    console.warn("Unable to read DB article.", error);
    return null;
  }
}

function mapDbArticle(row: DbArticle): ArticleRecord {
  const title = row.title?.trim() || "Untitled SoleInsider Story";
  const content = row.content ?? "";
  const cleanedText = cleanArticleText(content);
  const date = formatArticleDate(row.createdAt);
  const category = getArticleCategory(row.keywords, title);

  return {
    id: String(row.id),
    slug: row.slug?.trim() || String(row.id),
    title,
    deck: toDeck(cleanedText, title),
    author: "SoleInsider Editorial",
    date,
    category,
    image: normalizeArticleImage(row.cover),
    body: splitParagraphs(cleanedText),
    html: sanitizeArticleHtml(content),
    legacyUrl: `/article/${row.slug?.trim() || row.id}`,
    keywords: (row.keywords ?? "")
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean),
  };
}

function normalizeArticleImage(image: string | null | undefined) {
  const normalized = image?.trim();

  if (!normalized) return "";
  if (/^https?:\/\//i.test(normalized)) return normalized;

  return `https://soleinsider.com/${normalized.replace(/^\/+/, "")}`;
}

function formatArticleDate(date: Date | null) {
  return (date ?? new Date()).toISOString().slice(0, 10);
}

function getArticleCategory(keywords: string | null, title: string) {
  const haystack = `${keywords ?? ""} ${title}`.toLowerCase();

  if (haystack.includes("fake") || haystack.includes("real")) return "Authentication";
  if (haystack.includes("jordan")) return "Jordan";
  if (haystack.includes("yeezy")) return "Yeezy";
  if (haystack.includes("resell") || haystack.includes("market")) return "Market";

  return "Article";
}

function toDeck(text: string, title: string) {
  const withoutTitle = text.replace(title, "").trim();
  const source = withoutTitle || text || title;

  if (source.length <= 180) {
    return source;
  }

  // Prefer ending on a complete sentence; otherwise cut at the last whole
  // word. Slicing at a fixed offset used to strand fragments like
  // "high-qualit..." on every article card.
  const window = source.slice(0, 180);
  const lastSentenceEnd = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf("! "),
    window.lastIndexOf("? "),
  );

  if (lastSentenceEnd > 90) {
    return window.slice(0, lastSentenceEnd + 1).trim();
  }

  const lastSpace = window.lastIndexOf(" ");
  const trimmed = (lastSpace > 0 ? window.slice(0, lastSpace) : window).trim();

  return `${trimmed.replace(/[,;:.\-–—]+$/, "")}...`;
}

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}|(?<=\.)\s+(?=[A-Z0-9])/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function cleanArticleText(content: string) {
  return decodeHtml(content)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeArticleHtml(content: string) {
  const decoded = decodeHtml(content)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\sdata-src=/gi, " src=");

  return decoded.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, tagName, attrs) => {
    const normalizedTag = String(tagName).toLowerCase();
    const isClosing = tag.startsWith("</");

    if (!allowedTags.has(normalizedTag)) {
      return "";
    }

    if (isClosing) {
      return normalizedTag === "img" || normalizedTag === "br" || normalizedTag === "hr"
        ? ""
        : `</${normalizedTag}>`;
    }

    if (normalizedTag === "a") {
      const href = getSafeAttribute(attrs, "href");
      return href ? `<a href="${href}" rel="nofollow noopener">` : "<a>";
    }

    if (normalizedTag === "img") {
      const src = getSafeAttribute(attrs, "src");
      const alt = getPlainAttribute(attrs, "alt");
      return src ? `<img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" />` : "";
    }

    return normalizedTag === "br" || normalizedTag === "hr"
      ? `<${normalizedTag} />`
      : `<${normalizedTag}>`;
  });
}

function getSafeAttribute(attrs: string, name: string) {
  const value = getPlainAttribute(attrs, name);

  if (/^https?:\/\//i.test(value) || value.startsWith("/")) {
    return escapeHtml(value);
  }

  return "";
}

function getPlainAttribute(attrs: string, name: string) {
  const match = attrs.match(new RegExp(`${name}=["']([^"']*)["']`, "i"));
  return decodeHtml(match?.[1] ?? "").trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
