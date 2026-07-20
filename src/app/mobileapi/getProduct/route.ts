import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbProduct } from "@/lib/dbMobileApi";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return legacyJson(await getDbProduct(searchParams.get("product_id")));
}
