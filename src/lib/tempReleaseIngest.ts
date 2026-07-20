import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

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
  const existing = await prisma.tempProduct.findFirst({
    where: {
      OR: [
        { hash: normalized.hash },
        { link: normalized.link },
        normalized.sku ? { sku: normalized.sku } : undefined,
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

function normalizeImages(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((image) => image.trim())
        .filter((image) => /^https?:\/\//i.test(image))
        .filter((image) => !/\.webp(?:$|\?)/i.test(image))
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
