import {
  getTokens,
  legacyJson,
  readLegacyPostBody,
} from "@/lib/legacyMobileApi";

export async function POST(request: Request) {
  return legacyJson(getTokens(await readLegacyPostBody(request)));
}
