import {
  leaveComment,
  legacyJson,
  readLegacyPostBody,
} from "@/lib/legacyMobileApi";

export async function POST(request: Request) {
  const body = await readLegacyPostBody(request);
  const result = leaveComment(body);

  return legacyJson(result, { status: result.success ? 200 : 400 });
}
