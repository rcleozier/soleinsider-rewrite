import { getSlideshow, legacyJson } from "@/lib/legacyMobileApi";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return legacyJson(getSlideshow(searchParams.get("product_id")));
}
