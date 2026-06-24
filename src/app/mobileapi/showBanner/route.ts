import { legacyJson, showBanner } from "@/lib/legacyMobileApi";

export function GET() {
  return legacyJson(showBanner());
}
