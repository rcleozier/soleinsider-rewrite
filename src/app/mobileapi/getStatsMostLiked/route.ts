import { getStatsMostLiked, legacyJson } from "@/lib/legacyMobileApi";

export function GET() {
  return legacyJson(getStatsMostLiked());
}
