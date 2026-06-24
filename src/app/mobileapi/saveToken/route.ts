import {
  legacyJson,
  readLegacyPostBody,
  saveToken,
} from "@/lib/legacyMobileApi";

export async function POST(request: Request) {
  return legacyJson(saveToken(await readLegacyPostBody(request)));
}
