import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbStatsMostProfit } from "@/lib/dbMobileApi";

export async function GET() {
  return legacyJson(await getDbStatsMostProfit());
}
