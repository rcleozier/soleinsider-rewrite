import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbReleasesOnLegacyDate } from "@/lib/dbMobileApi";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const releases = await getDbReleasesOnLegacyDate(date);

  return legacyJson(releases);
}
