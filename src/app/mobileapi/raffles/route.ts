import { getRaffles, legacyJson } from "@/lib/legacyMobileApi";

export function GET() {
  return legacyJson(getRaffles());
}
