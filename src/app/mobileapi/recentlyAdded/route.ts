import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbRecentlyAddedReleases } from "@/lib/dbMobileApi";

// "Recently added" must reflect the newest crawled/approved products the moment
// they land — never a build-time snapshot or an ISR-cached response.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return legacyJson(await getDbRecentlyAddedReleases());
}
