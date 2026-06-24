import {
  legacyJson,
  readLegacyPostBody,
  voteComment,
} from "@/lib/legacyMobileApi";

export async function POST(request: Request) {
  const body = await readLegacyPostBody(request);

  return legacyJson(voteComment(body));
}
