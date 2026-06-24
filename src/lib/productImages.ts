export const productImageBaseUrl = "https://soleinsider.com/public/products";

export function getProductImageUrl(image: string | null | undefined) {
  const normalizedImage = image?.trim();

  if (!normalizedImage) {
    return `${productImageBaseUrl}/ipad_adidas-anthony-edwards-2-lucid-blue.png`;
  }

  if (/^https?:\/\//i.test(normalizedImage)) {
    return normalizedImage;
  }

  return `${productImageBaseUrl}/${normalizedImage.replace(/^\/+/, "")}`;
}
