import { getStockxTrending, legacyJson } from "@/lib/legacyMobileApi";

export function GET() {
  return legacyJson(getStockxTrending());
}
