import { legacyJson } from "@/lib/legacyMobileApi";
import { searchDbReleases } from "@/lib/dbMobileApi";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return legacyJson(await searchDbReleases(searchParams.get("search")));
}
