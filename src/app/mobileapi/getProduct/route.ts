import { getProduct, legacyJson } from "@/lib/legacyMobileApi";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return legacyJson(getProduct(searchParams.get("product_id")));
}
