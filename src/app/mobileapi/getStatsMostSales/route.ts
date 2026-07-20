import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbStatsMostSales } from "@/lib/dbMobileApi";

export async function GET() {
  return legacyJson(await getDbStatsMostSales());
}
