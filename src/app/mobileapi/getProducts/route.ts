import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbProducts } from "@/lib/dbMobileApi";

export async function GET() {
  return legacyJson(await getDbProducts());
}
