import { getRecentlyAddedReleases, legacyJson } from "@/lib/legacyMobileApi";

export function GET() {
  return legacyJson(getRecentlyAddedReleases());
}
