import { getNews, legacyJson } from "@/lib/legacyMobileApi";

export function GET() {
  return legacyJson(getNews());
}
