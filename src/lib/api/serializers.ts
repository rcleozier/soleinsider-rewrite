import type { LegacyRelease } from "@/lib/legacyMobileApi";
import { getProductImageUrl } from "@/lib/productImages";
import {
  formatReleaseDate,
  getAbsoluteReleaseUrl,
  getBrandName,
  getReleaseUrl,
  cleanHtmlContent,
} from "@/lib/siteData";

export type ApiRelease = {
  productId: string;
  name: string;
  slug: string;
  brand: string;
  type: string;
  sku: string | null;
  colorway: string | null;
  description: string | null;
  price: { retail: number | null; formatted: string };
  releaseDate: { iso: string | null; display: string; timestamp: number | null };
  images: { primary: string; gallery: string[] };
  votes: { cop: number; drop: number; total: number; copPercentage: number };
  links: { web: string; api: string; path: string };
};

/**
 * One release shape across every endpoint. Values are typed rather than the
 * all-strings legacy /mobileapi format — the mobile client shouldn't have to
 * parse "0" into a number or guess whether a field is missing.
 */
export function serializeRelease(release: LegacyRelease, gallery: string[] = []): ApiRelease {
  const cop = Number(release.yes_votes) || 0;
  const drop = Number(release.no_votes) || 0;
  const total = cop + drop;
  const retail = Number(release.price);
  const iso = toIsoDate(release.release_date_calendar);
  const cleanedDescription = cleanHtmlContent(release.content || "");

  return {
    productId: release.product_id,
    name: release.name,
    slug: release.slug,
    brand: getBrandName(release),
    type: release.type || "sneakers",
    sku: release.sku?.trim() || null,
    colorway: getColorway(release.name),
    description: cleanedDescription || null,
    price: {
      retail: Number.isFinite(retail) && retail > 0 ? retail : null,
      formatted: Number.isFinite(retail) && retail > 0 ? `$${retail.toLocaleString()}` : "TBA",
    },
    releaseDate: {
      iso,
      display: formatReleaseDate(release),
      timestamp: iso ? Date.parse(`${iso}T00:00:00Z`) : null,
    },
    images: {
      primary: getProductImageUrl(release.image),
      gallery: gallery.map((image) => getProductImageUrl(image)),
    },
    votes: {
      cop,
      drop,
      total,
      copPercentage: total ? Math.round((cop / total) * 100) : 0,
    },
    links: {
      web: getAbsoluteReleaseUrl(release),
      api: `/api/v1/releases/${release.product_id}`,
      path: getReleaseUrl(release),
    },
  };
}

/** `release_date_calendar` is stored as "YYYY,M,D,..." — normalize to ISO. */
function toIsoDate(calendarValue: string) {
  const match = calendarValue?.match(/^(\d{4}),(\d{1,2}),(\d{1,2})/);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function getColorway(name: string) {
  const quoted = name.match(/["“']([^"”']+)["”']/);

  if (quoted) {
    return quoted[1];
  }

  const dashed = name.split(" - ")[1];

  return dashed?.trim() || null;
}
