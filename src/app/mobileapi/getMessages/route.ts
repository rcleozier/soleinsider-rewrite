import { legacyJson } from "@/lib/legacyMobileApi";
import { emptyLegacyCollection } from "@/lib/dbMobileApi";

export function GET() {
  return legacyJson(emptyLegacyCollection());
}
