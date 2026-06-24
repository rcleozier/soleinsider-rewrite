import { getProducts, legacyJson } from "@/lib/legacyMobileApi";

export function GET() {
  return legacyJson(getProducts());
}
