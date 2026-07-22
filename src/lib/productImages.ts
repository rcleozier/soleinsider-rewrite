// Product images live at the root of the S3 bucket, keyed by the bare
// filename stored in products.image / product_images.image. Verified against
// a random sample of 100 rows: every one resolves in the bucket.
//
// Set S3_PUBLIC_HOSTNAME to put a CloudFront/custom domain in front. If the
// S3 env vars are absent (e.g. a local checkout without credentials), this
// falls back to the legacy soleinsider.com path so images still render.
const legacyImageBaseUrl = "https://soleinsider.com/public/products";

function getImageBaseUrl() {
  if (process.env.S3_PUBLIC_HOSTNAME) {
    return `https://${process.env.S3_PUBLIC_HOSTNAME}`;
  }

  if (process.env.S3_BUCKET_NAME && process.env.AWS_REGION) {
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
  }

  return legacyImageBaseUrl;
}

export const productImageBaseUrl = getImageBaseUrl();

export function getProductImageUrl(image: string | null | undefined) {
  const normalizedImage = image?.trim();
  const baseUrl = getImageBaseUrl();

  if (!normalizedImage) {
    return `${baseUrl}/ipad_adidas-anthony-edwards-2-lucid-blue.png`;
  }

  if (/^https?:\/\//i.test(normalizedImage)) {
    return normalizedImage;
  }

  return `${baseUrl}/${normalizedImage.replace(/^\/+/, "")}`;
}
