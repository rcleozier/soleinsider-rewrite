import { getRandomProduct, legacyJson } from "@/lib/legacyMobileApi";

export function GET() {
  return legacyJson(getRandomProduct());
}
