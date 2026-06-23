import { copOrNot, legacyJson, readLegacyPostBody } from "@/lib/legacyMobileApi";

export async function POST(request: Request) {
  const body = await readLegacyPostBody(request);
  const result = copOrNot(body);

  return legacyJson(result, { status: result.success ? 200 : 400 });
}
