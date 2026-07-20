import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbCombinedReleaseDates } from "@/lib/dbMobileApi";

export async function GET() {
  return legacyJson(await getDbCombinedReleaseDates());
}
