import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbRandomProduct } from "@/lib/dbMobileApi";

export async function GET() {
  return legacyJson(await getDbRandomProduct());
}
