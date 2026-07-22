import { createHash } from "node:crypto";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Configure these once the bucket exists:
//   AWS_REGION               e.g. "us-east-1"
//   AWS_ACCESS_KEY_ID
//   AWS_SECRET_ACCESS_KEY
//   S3_BUCKET_NAME
//   S3_PUBLIC_HOSTNAME       optional — a CloudFront/custom domain in front of
//                            the bucket. Defaults to the bucket's virtual-hosted
//                            S3 endpoint if omitted.
// Also add the resulting hostname to `images.remotePatterns` in next.config.ts
// so next/image is allowed to render it.

export function isS3Configured() {
  return Boolean(
    process.env.AWS_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.S3_BUCKET_NAME,
  );
}

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
}

function getPublicHostname() {
  return (
    process.env.S3_PUBLIC_HOSTNAME ||
    `${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`
  );
}

/**
 * Uploads raw bytes to S3 under the given key and returns the public URL.
 * Throws if S3 isn't configured — callers should check `isS3Configured()`
 * first and surface a friendly message instead of letting this throw reach
 * the user.
 */
export async function uploadBufferToS3(
  bytes: Uint8Array,
  key: string,
  contentType: string,
) {
  if (!isS3Configured()) {
    throw new Error(
      "S3 is not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME.",
    );
  }

  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: bytes,
      ContentType: contentType || "application/octet-stream",
      // No ACL is set: modern buckets with "Bucket owner enforced" object
      // ownership reject ACLs outright. Public read is expected to come from
      // the bucket policy instead.
    }),
  );

  return `https://${getPublicHostname()}/${key}`;
}

// Product shots never render wider than the detail-page carousel. Admin
// uploads come straight off a phone or a brand's press kit and are routinely
// 5-15MB, so they're downscaled and re-encoded before they ever reach S3.
const PRODUCT_MAX_WIDTH = 1400;
const PRODUCT_QUALITY = 82;

/**
 * Uploads a single product image under `products/`, resized to a sane max
 * width and re-encoded as WebP. Non-raster uploads (e.g. SVG) are passed
 * through untouched, since sharp would rasterize them.
 */
export async function uploadProductImageToS3(file: File, keyPrefix: string) {
  const originalBytes = new Uint8Array(await file.arrayBuffer());
  const stem = `products/${keyPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (!isResizableImage(file.type)) {
    const extension = getExtension(file.name, file.type);
    return uploadBufferToS3(
      originalBytes,
      `${stem}${extension}`,
      file.type || "application/octet-stream",
    );
  }

  const { default: sharp } = await import("sharp");

  const optimized = await sharp(originalBytes)
    .rotate() // honour EXIF orientation before stripping metadata
    .resize({ width: PRODUCT_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: PRODUCT_QUALITY })
    .toBuffer();

  return uploadBufferToS3(optimized, `${stem}.webp`, "image/webp");
}

async function objectExistsInS3(key: string) {
  const client = getS3Client();

  try {
    await client.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: key }));
    return true;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      ("$metadata" in error
        ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404
        : (error as { name?: string }).name === "NotFound")
    ) {
      return false;
    }

    throw error;
  }
}

/**
 * Uploads bytes to S3 keyed by their own content hash — identical bytes
 * always resolve to the same key, so re-crawling a release (or two crawlers
 * finding the same picture) reuses the existing object instead of writing a
 * new one every time. Skips the PUT entirely when the object already exists.
 */
async function uploadContentAddressedToS3(bytes: Uint8Array, prefix: string, extension: string, contentType: string) {
  const digest = createHash("sha256").update(bytes).digest("hex");
  const key = `${prefix}/${digest}${extension}`;

  if (!(await objectExistsInS3(key))) {
    await uploadBufferToS3(bytes, key, contentType);
  }

  return `https://${getPublicHostname()}/${key}`;
}

/**
 * Fetches an externally-hosted image (e.g. from a crawled source site) and
 * re-uploads it to S3 under `products/` — the same prefix live release images
 * live under, since a crawled release is very likely to get approved into
 * the real product record and there's no reason to move the file when that
 * happens. Crawled releases must never hotlink a third-party image — those
 * URLs routinely rot or get taken down once the source site moves on.
 * Deduplicated by content hash, so the same picture is never stored twice.
 */
export async function uploadImageUrlToS3(sourceUrl: string) {
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status}): ${sourceUrl}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const originalBytes = new Uint8Array(await response.arrayBuffer());

  if (!isResizableImage(contentType)) {
    const extension = getExtension(sourceUrl, contentType);
    return uploadContentAddressedToS3(
      originalBytes,
      "products",
      extension,
      contentType || "application/octet-stream",
    );
  }

  const { default: sharp } = await import("sharp");

  const optimized = await sharp(originalBytes)
    .rotate()
    .resize({ width: PRODUCT_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: PRODUCT_QUALITY })
    .toBuffer();

  return uploadContentAddressedToS3(optimized, "products", ".webp", "image/webp");
}

function isResizableImage(mimeType: string) {
  return /^image\/(jpeg|jpg|png|webp|avif|tiff|gif)$/i.test(mimeType);
}

function getExtension(filename: string, mimeType: string) {
  const fromName = filename.match(/\.[a-zA-Z0-9]+$/)?.[0];

  if (fromName) {
    return fromName.toLowerCase();
  }

  const fromMime = mimeType.split("/")[1];

  return fromMime ? `.${fromMime}` : "";
}
