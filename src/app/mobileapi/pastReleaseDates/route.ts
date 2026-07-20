import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbPastReleaseDates } from "@/lib/dbMobileApi";

export async function GET() {
  return legacyJson(await getDbPastReleaseDates());
}
