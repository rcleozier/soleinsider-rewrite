import { getReleasesOnDate, legacyJson } from "@/lib/legacyMobileApi";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return legacyJson(getReleasesOnDate(searchParams.get("date")));
}
