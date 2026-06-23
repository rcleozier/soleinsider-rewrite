import { legacyJson, searchReleases } from "@/lib/legacyMobileApi";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return legacyJson(searchReleases(searchParams.get("search")));
}
