import { legacyJson } from "@/lib/legacyMobileApi";
import { showDbBanner } from "@/lib/dbMobileApi";

export function GET() {
  return legacyJson(showDbBanner());
}
