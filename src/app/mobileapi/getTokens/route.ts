import {
  legacyJson,
  readLegacyPostBody,
} from "@/lib/legacyMobileApi";
import { getDbTokens } from "@/lib/dbMobileApi";

export async function POST(request: Request) {
  return legacyJson(await getDbTokens(await readLegacyPostBody(request)));
}
