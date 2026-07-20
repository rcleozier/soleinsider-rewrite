import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbComments } from "@/lib/dbMobileApi";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return legacyJson(await getDbComments(searchParams.get("product_id")));
}
