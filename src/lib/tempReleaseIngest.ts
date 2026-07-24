import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { isS3Configured, uploadImageUrlToS3 } from "@/lib/s3";

export type TempReleasePayload = {
  title?: unknown;
  name?: unknown;
  url?: unknown;
  link?: unknown;
  color?: unknown;
  colorway?: unknown;
  price?: unknown;
  content?: unknown;
  description?: unknown;
  sku?: unknown;
  releaseDate?: unknown;
  release_date?: unknown;
  hash?: unknown;
  images?: unknown;
  image?: unknown;
  type?: unknown;
};

export type TempReleaseIngestResult = {
  id: number;
  created: boolean;
  imageCount: number;
  status: string | null;
};

export async function saveTempReleaseFromPayload(
  payload: TempReleasePayload,
): Promise<TempReleaseIngestResult> {
  const normalized = normalizeTempReleasePayload(payload);
  const rehostedImages = await rehostImages(normalized.images);
  normalized.image = rehostedImages[0] || "";
  normalized.images = rehostedImages;

  const existing = await prisma.tempProduct.findFirst({
    where: {
      OR: [
        { hash: normalized.hash },
        { link: normalized.link },
        // "TBA" is the sentinel default for a missing SKU, not a real match key —
        // matching on it would collide unrelated releases together (see incident
        // where a fresh POST silently overwrote an unrelated rejected row).
        normalized.sku && normalized.sku !== "TBA" ? { sku: normalized.sku } : undefined,
      ].filter(Boolean) as { hash?: string; link?: string; sku?: string }[],
    },
  });
  const now = new Date();
  const product = existing
    ? await prisma.tempProduct.update({
        where: { id: existing.id },
        data: {
          name: normalized.name,
          sku: normalized.sku,
          image: normalized.image,
          link: normalized.link,
          description: normalized.description,
          content: normalized.content,
          slug: normalized.slug,
          hash: normalized.hash,
          price: normalized.price,
          type: normalized.type,
          releaseDate: normalized.releaseDate,
          updatedAt: now,
        },
      })
    : await prisma.tempProduct.create({
        data: {
          name: normalized.name,
          sku: normalized.sku,
          image: normalized.image,
          link: normalized.link,
          description: normalized.description,
          content: normalized.content,
          slug: normalized.slug,
          hash: normalized.hash,
          price: normalized.price,
          status: "new",
          type: normalized.type,
          releaseDate: normalized.releaseDate,
          createdAt: now,
          updatedAt: now,
        },
      });

  await prisma.tempProductImage.deleteMany({
    where: { productId: product.id },
  });

  if (normalized.images.length) {
    await prisma.tempProductImage.createMany({
      data: normalized.images.map((image) => ({
        productId: product.id,
        image,
      })),
    });
  }

  return {
    id: product.id,
    created: !existing,
    imageCount: normalized.images.length,
    status: product.status,
  };
}

export async function payloadFromRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as TempReleasePayload;
  }

  const formData = await request.formData();
  const payload: TempReleasePayload = {};

  for (const [key, value] of formData.entries()) {
    payload[key as keyof TempReleasePayload] = value;
  }

  return payload;
}

export function isAuthorizedIngestRequest(request: Request) {
  const secret = process.env.CRAWLER_INGEST_SECRET;

  if (!secret) {
    return true;
  }

  return (
    request.headers.get("x-cron-secret") === secret ||
    request.headers.get("authorization") === `Bearer ${secret}`
  );
}

function normalizeTempReleasePayload(payload: TempReleasePayload) {
  const name = clampText(
    stringify(payload.title) || stringify(payload.name),
    200,
    "Untitled release",
  );
  const link = stringify(payload.url) || stringify(payload.link);

  if (!link) {
    throw new Error("Missing release URL.");
  }

  const images = normalizeImages(stringify(payload.images) || stringify(payload.image));
  const releaseDate = parseReleaseDate(
    stringify(payload.releaseDate) || stringify(payload.release_date),
  );
  const hash = clampText(
    stringify(payload.hash) || createHash("md5").update(link).digest("hex"),
    255,
    "",
  );
  const sku = clampText(stringify(payload.sku) || "TBA", 11, "TBA");
  const color = stringify(payload.color) || stringify(payload.colorway);
  const description = clampText(
    stringify(payload.description) || color || name,
    65_535,
    name,
  );

  return {
    name,
    sku,
    image: images[0] || "",
    images,
    link,
    description,
    content: stringify(payload.content) || null,
    slug: clampText(slugify(name), 255, hash.slice(0, 20)),
    hash,
    price: normalizePrice(payload.price),
    status: "new",
    type: clampText(normalizeType(stringify(payload.type)), 30, "sneakers"),
    releaseDate,
  };
}

/**
 * Crawled images live on the source site's own CDN and routinely rot or
 * disappear once that site moves on — every image is re-uploaded to our own
 * S3 bucket before the temp release is ever stored. An image that fails to
 * rehost is dropped rather than falling back to the original URL, so nothing
 * downstream ever hotlinks a third party. Uploads are content-addressed (see
 * uploadImageUrlToS3), so re-crawling the same picture reuses the existing
 * S3 object instead of writing a duplicate.
 */
async function rehostImages(sourceUrls: string[]) {
  if (!sourceUrls.length) {
    return [];
  }

  if (!isS3Configured()) {
    console.warn("S3 is not configured; temp release ingest cannot rehost images.");
    return [];
  }

  const uploaded = await Promise.all(
    sourceUrls.map(async (url) => {
      try {
        return await uploadImageUrlToS3(url);
      } catch (error) {
        console.warn(`Unable to rehost image to S3, dropping it: ${url}`, error);
        return null;
      }
    }),
  );

  return uploaded.filter((url): url is string => Boolean(url));
}

function normalizeImages(value: string) {
  // Note: do NOT filter out .webp source URLs here. Some sources (Sole
  // Retriever) serve every product photo as .webp, and rehostImages
  // re-encodes whatever we accept to WebP on S3 anyway — dropping webp
  // sources just guarantees those releases save with no product image.
  return Array.from(
    new Set(
      value
        .split(",")
        .map((image) => image.trim())
        .filter((image) => /^https?:\/\//i.test(image))
        .slice(0, 8),
    ),
  );
}

function normalizePrice(value: unknown) {
  const numeric = Number(String(value ?? "").replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(numeric) || numeric < 0) {
    return "0.00";
  }

  return Math.min(numeric, 999.99).toFixed(2);
}

function parseReleaseDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed || /tba|soon/i.test(trimmed)) {
    return null;
  }

  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function normalizeType(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return "sneakers";
  }

  if (normalized === "streetwear") {
    return "clothing";
  }

  return normalized;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function stringify(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function clampText(value: string, length: number, fallback: string) {
  const text = value.trim() || fallback;
  return text.slice(0, length);
}
