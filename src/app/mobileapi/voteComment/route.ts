import {
  legacyJson,
  readLegacyPostBody,
} from "@/lib/legacyMobileApi";
import { voteDbComment } from "@/lib/dbMobileApi";

export async function POST(request: Request) {
  const body = await readLegacyPostBody(request);

  return legacyJson(await voteDbComment(body));
}
