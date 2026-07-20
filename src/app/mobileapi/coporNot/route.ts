import { recordDbCopDropVote } from "@/lib/dbReleases";
import { copOrNot, legacyJson, readLegacyPostBody } from "@/lib/legacyMobileApi";

export async function POST(request: Request) {
  const body = await readLegacyPostBody(request);
  const dbVote = await recordDbCopDropVote(
    body.product_id || "",
    body.status || "",
    body.member_id || "0",
  );

  if (dbVote) {
    return legacyJson(true);
  }

  return legacyJson(copOrNot(body));
}
