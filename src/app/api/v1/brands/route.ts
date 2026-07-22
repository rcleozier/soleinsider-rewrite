import { brandDirectory } from "@/lib/brands";
import { apiSuccess } from "@/lib/api/response";
import { serializeBrand } from "@/lib/api/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/brands
 * The full brand directory, alphabetical. Static per deploy — brand
 * definitions live in code, not the DB — so this doesn't hit prisma.
 */
export async function GET() {
  const brands = brandDirectory
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }))
    .map(serializeBrand);

  return apiSuccess({ brands }, { count: brands.length }, 3600);
}
