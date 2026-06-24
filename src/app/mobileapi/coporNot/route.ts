import { copOrNot, legacyJson, readLegacyPostBody } from "@/lib/legacyMobileApi";

export async function POST(request: Request) {
  const body = await readLegacyPostBody(request);

  return legacyJson(copOrNot(body));
}
