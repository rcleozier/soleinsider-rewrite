import { getComments, legacyJson } from "@/lib/legacyMobileApi";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return legacyJson(getComments(searchParams.get("product_id")));
}
