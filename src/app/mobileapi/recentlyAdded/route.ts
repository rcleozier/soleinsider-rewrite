import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbRecentlyAddedReleases } from "@/lib/dbMobileApi";

export async function GET() {
  return legacyJson(await getDbRecentlyAddedReleases());
}
