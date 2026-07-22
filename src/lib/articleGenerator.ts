import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { getAllTopics, type ArticleCategory, type ArticleTopic } from "@/lib/articleTopics";
import { generateArticleCopy, generateArticleCoverImage, isOpenAiConfigured } from "@/lib/openaiClient";
import { isS3Configured, uploadBufferToS3 } from "@/lib/s3";

// gpt-image-1 returns a 1024x1024 PNG. Covers render at up to the ~1180px
// content column, so these are sized at 2x for retina and re-encoded as WebP.
// Still a large reduction versus the raw PNG, but with enough headroom that
// the hero image stays sharp on a high-DPI display.
// Matches the native 1536x1024 source cropped to 16:9, so the cover is never
// upscaled — 2x the ~1180px content column, i.e. retina-sharp.
const COVER_WIDTH = 1536;
const COVER_HEIGHT = 864;
const COVER_QUALITY = 90;

export type GenerateArticlesOptions = {
  count?: number;
  category?: ArticleCategory;
};

export type GeneratedArticleResult =
  | { success: true; topic: ArticleTopic; slug: string; articleId: number }
  | { success: false; topic: ArticleTopic; error: string };

/**
 * Picks unused topics, writes each with OpenAI, generates + uploads a cover
 * image, and inserts the Article row. Topics are matched to already-published
 * slugs first (one query) so re-running this never has to ask OpenAI just to
 * find out a topic was already covered.
 */
export async function generateArticles({
  count = 3,
  category,
}: GenerateArticlesOptions = {}): Promise<GeneratedArticleResult[]> {
  if (!isOpenAiConfigured()) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  if (!isS3Configured()) {
    throw new Error(
      "S3 is not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME.",
    );
  }

  const topics = await pickAvailableTopics(count, category);

  if (!topics.length) {
    return [];
  }

  const results: GeneratedArticleResult[] = [];

  // Sequential on purpose: this keeps OpenAI/S3 rate limits predictable for a
  // cron job that might run unattended, rather than bursting N requests.
  for (const topic of topics) {
    try {
      const result = await generateOneArticle(topic);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        topic,
        error: error instanceof Error ? error.message : "Unknown error.",
      });
    }
  }

  return results;
}

async function pickAvailableTopics(count: number, category?: ArticleCategory) {
  const allTopics = getAllTopics().filter((topic) => !category || topic.category === category);
  const slugs = allTopics.map((topic) => topic.slug);

  const existing = await prisma.article.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true },
  });
  const usedSlugs = new Set(existing.map((row) => row.slug));

  const available = allTopics.filter((topic) => !usedSlugs.has(topic.slug));

  // Shuffle so a small `count` doesn't always pull from the start of the list.
  for (let i = available.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  return available.slice(0, count);
}

async function generateOneArticle(topic: ArticleTopic): Promise<GeneratedArticleResult> {
  const copy = await generateArticleCopy(topic.brief);
  const rawImage = await generateArticleCoverImage(copy.imagePrompt);

  // Crop to a 16:9 editorial banner and re-encode. `cover` fit keeps the
  // subject centred rather than letterboxing the square source.
  const optimizedImage = await sharp(rawImage)
    .resize(COVER_WIDTH, COVER_HEIGHT, { fit: "cover", position: "attention" })
    .webp({ quality: COVER_QUALITY })
    .toBuffer();

  const key = `articles/${topic.slug}-${Date.now()}.webp`;
  const coverUrl = await uploadBufferToS3(optimizedImage, key, "image/webp");

  const keywords = Array.from(new Set([...copy.keywords, topic.category]))
    .join(", ")
    .slice(0, 255);

  const now = new Date();

  const article = await prisma.article.create({
    data: {
      title: copy.title.slice(0, 255),
      content: copy.contentHtml,
      cover: coverUrl,
      slug: topic.slug,
      keywords,
      createdAt: now,
      updatedAt: now,
    },
  });

  return { success: true, topic, slug: topic.slug, articleId: article.id };
}
