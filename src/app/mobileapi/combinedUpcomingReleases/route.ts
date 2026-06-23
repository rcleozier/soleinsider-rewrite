import { getUpcomingReleases, legacyJson } from "@/lib/legacyMobileApi";

export function GET() {
  return legacyJson(getUpcomingReleases());
}
