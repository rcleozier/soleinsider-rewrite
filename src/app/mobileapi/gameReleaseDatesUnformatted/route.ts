import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbReleaseDatesUnformatted } from "@/lib/dbMobileApi";

export async function GET() {
  return legacyJson(await getDbReleaseDatesUnformatted("games"));
}
