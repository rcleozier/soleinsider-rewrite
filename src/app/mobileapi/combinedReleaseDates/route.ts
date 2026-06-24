import { getCombinedReleaseDates, legacyJson } from "@/lib/legacyMobileApi";

export function GET() {
  return legacyJson(getCombinedReleaseDates());
}
