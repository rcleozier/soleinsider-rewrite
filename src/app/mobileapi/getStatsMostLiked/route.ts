import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbStatsMostLiked } from "@/lib/dbMobileApi";

export async function GET() {
  return legacyJson(await getDbStatsMostLiked());
}
