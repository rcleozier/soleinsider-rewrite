import { getDbReleasesOnMonthDay } from "@/lib/dbReleases";
import { apiError, apiSuccess } from "@/lib/api/response";
import { serializeRelease } from "@/lib/api/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LIMIT = 240;

/**
 * GET /api/v1/releases/on-this-day?month=7&day=22&limit=120
 * Sneaker releases whose release date falls on this month/day across all
 * years, newest year first. `month`/`day` default to today (server time).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const now = new Date();

  const monthParam = Number(searchParams.get("month") ?? String(now.getMonth() + 1));
  const dayParam = Number(searchParams.get("day") ?? String(now.getDate()));
  const limitParam = Number(searchParams.get("limit") ?? "120");

  if (!Number.isInteger(monthParam) || monthParam < 1 || monthParam > 12) {
    return apiError("`month` must be an integer between 1 and 12.", 400);
  }

  if (!Number.isInteger(dayParam) || dayParam < 1 || dayParam > 31) {
    return apiError("`day` must be an integer between 1 and 31.", 400);
  }

  if (!Number.isFinite(limitParam) || limitParam < 1) {
    return apiError("`limit` must be a positive number.", 400);
  }

  const limit = Math.min(limitParam, MAX_LIMIT);
  const releases = await getDbReleasesOnMonthDay(monthParam, dayParam, limit);

  if (releases === null) {
    return apiError("Unable to load releases for that date.", 500);
  }

  return apiSuccess(
    { releases: releases.map((release) => serializeRelease(release)) },
    { month: monthParam, day: dayParam, limit, count: releases.length },
    3600,
  );
}
