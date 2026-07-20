import { getReleasesOnDate, legacyJson } from "@/lib/legacyMobileApi";
import { getDbReleasesOnMonthDay } from "@/lib/dbReleases";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const dbReleases = await getDbReleasesOnMonthDayFromLegacyDate(date);

  return legacyJson(dbReleases ?? getReleasesOnDate(date));
}

function getDbReleasesOnMonthDayFromLegacyDate(date: string | null) {
  const normalizedDate = date || formatMonthDay(new Date());
  const match = normalizedDate.match(/^(\d{2})-(\d{2})$/);

  if (!match) {
    return Promise.resolve(null);
  }

  const [, month, day] = match.map(Number);
  return getDbReleasesOnMonthDay(month, day);
}

function formatMonthDay(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}
