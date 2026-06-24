import { getReleaseDatesUnformatted, legacyJson } from "@/lib/legacyMobileApi";

export function GET() {
  return legacyJson(getReleaseDatesUnformatted("sneakers"));
}
