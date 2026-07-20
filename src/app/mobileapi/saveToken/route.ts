import {
  legacyJson,
  readLegacyPostBody,
} from "@/lib/legacyMobileApi";
import { saveDbToken } from "@/lib/dbMobileApi";

export async function POST(request: Request) {
  return legacyJson(await saveDbToken(await readLegacyPostBody(request)));
}
