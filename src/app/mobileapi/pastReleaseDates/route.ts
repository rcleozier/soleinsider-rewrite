import { getPastReleaseDates, legacyJson } from "@/lib/legacyMobileApi";

export function GET() {
  return legacyJson(getPastReleaseDates());
}
