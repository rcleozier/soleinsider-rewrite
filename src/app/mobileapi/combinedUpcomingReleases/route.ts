import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbUpcomingReleases } from "@/lib/dbMobileApi";

export async function GET() {
  return legacyJson(await getDbUpcomingReleases());
}
