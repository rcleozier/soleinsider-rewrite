import {
  legacyJson,
  readLegacyPostBody,
  voteComment,
} from "@/lib/legacyMobileApi";

export async function POST(request: Request) {
  const body = await readLegacyPostBody(request);
  const result = voteComment(body);

  return legacyJson(result, { status: result.success ? 200 : 400 });
}
