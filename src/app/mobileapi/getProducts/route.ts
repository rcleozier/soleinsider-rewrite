import { legacyJson } from "@/lib/legacyMobileApi";
import { getDbProducts } from "@/lib/dbMobileApi";

// Newest-products feed — always serve live data, never a cached snapshot.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return legacyJson(await getDbProducts());
}
