import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbSlideshow } from "@/lib/dbMobileApi";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return legacyJson(await getDbSlideshow(searchParams.get("product_id")));
}
