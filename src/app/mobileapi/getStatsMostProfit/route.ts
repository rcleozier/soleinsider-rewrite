import { getStatsMostProfit, legacyJson } from "@/lib/legacyMobileApi";

export function GET() {
  return legacyJson(getStatsMostProfit());
}
