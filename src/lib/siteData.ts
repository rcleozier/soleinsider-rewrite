import type { Metadata } from "next";
import type { LegacyRelease } from "@/lib/legacyMobileApi";
import { getProductImageUrl } from "@/lib/productImages";

export type Article = {
  slug: string;
  title: string;
  deck: string;
  author: string;
  date: string;
  category: string;
  image: string;
  body: string[];
};

export const siteUrl = "https://soleinsider.com";
export const siteName = "SoleInsider";
export const appStoreUrl =
  "https://apps.apple.com/us/app/sneaker-releases-soleinsider/id799668898";
export const googlePlayUrl =
  "https://play.google.com/store/apps/details?id=com.sole.insider.free&hl=en";

export const navigation = [
  { href: "/", label: "Release Dates" },
  { href: "/articles", label: "Stories" },
  { href: "/calendar", label: "Calendar" },
  { href: "/brands", label: "Brands" },
  { href: "/sports", label: "Sports" },
  { href: "/on-this-day", label: "On This Day" },
];

export function getReleaseImage(release: LegacyRelease) {
  return getProductImageUrl(release.image);
}

export function getReleaseUrl(release: LegacyRelease) {
  return `/${release.slug}/${release.product_id}`;
}

export function getAbsoluteReleaseUrl(release: LegacyRelease) {
  return `${siteUrl}/${release.slug}/${release.product_id}`;
}

export function formatReleaseDate(release: LegacyRelease) {
  return release.release_date.trim();
}

export function cleanHtmlContent(content: string) {
  return content
    .replace(/&lt;[\s\S]*?&gt;/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\bread more\s*$/i, "")
    .replace(/&[#a-z0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getBrandName(release: LegacyRelease) {
  const name = release.name.toLowerCase();

  if (name.includes("jordan")) return "Jordan";
  if (name.includes("nike")) return "Nike";
  if (name.includes("adidas")) return "adidas";
  if (name.includes("new balance")) return "New Balance";
  if (name.includes("yeezy")) return "Yeezy";
  if (name.includes("puma")) return "Puma";
  if (name.includes("asics")) return "ASICS";
  if (name.includes("off-white") || name.includes("off white")) return "Off-White";

  return "Sneakers";
}

export const brandReleasePages = [
  {
    slug: "air-jordan-releases",
    label: "Air Jordan",
    matcher: (release: LegacyRelease) => getBrandName(release) === "Jordan",
    title: "Air Jordan Releases",
    description:
      "Upcoming Air Jordan release dates, retail prices, style codes, and launch details.",
  },
  {
    slug: "nike-releases",
    label: "Nike",
    matcher: (release: LegacyRelease) => getBrandName(release) === "Nike",
    title: "Nike Releases",
    description:
      "Upcoming Nike sneaker release dates, retail prices, style codes, and launch details.",
  },
  {
    slug: "adidas-releases",
    label: "adidas",
    matcher: (release: LegacyRelease) => getBrandName(release) === "adidas",
    title: "Adidas Releases",
    description:
      "Upcoming adidas release dates, retail prices, style codes, and launch details.",
  },
  {
    slug: "yeezy-releases",
    label: "Yeezy",
    matcher: (release: LegacyRelease) => getBrandName(release) === "Yeezy",
    title: "Yeezy Releases",
    description:
      "Upcoming Yeezy release dates, retail prices, style codes, and launch details.",
  },
  {
    slug: "new-balance-releases",
    label: "New Balance",
    matcher: (release: LegacyRelease) => getBrandName(release) === "New Balance",
    title: "New Balance Releases",
    description:
      "Upcoming New Balance release dates, retail prices, style codes, and launch details.",
  },
  {
    slug: "puma-releases",
    label: "Puma",
    matcher: (release: LegacyRelease) => getBrandName(release) === "Puma",
    title: "Puma Releases",
    description:
      "Upcoming Puma release dates, retail prices, style codes, and launch details.",
  },
  {
    slug: "asics-releases",
    label: "ASICS",
    matcher: (release: LegacyRelease) => getBrandName(release) === "ASICS",
    title: "ASICS Releases",
    description:
      "Upcoming ASICS release dates, retail prices, style codes, and launch details.",
  },
  {
    slug: "off-white-releases",
    label: "Off-White",
    matcher: (release: LegacyRelease) => getBrandName(release) === "Off-White",
    title: "Off-White Releases",
    description:
      "Upcoming Off-White release dates, retail prices, style codes, and launch details.",
  },
] satisfies {
  slug: string;
  label: string;
  matcher: (release: LegacyRelease) => boolean;
  title: string;
  description: string;
}[];

export function getBrandReleasePage(slug: string) {
  return brandReleasePages.find((page) => page.slug === slug);
}

export const releaseArchivePages = [
  {
    slug: "releases-dates",
    title: "All Sneaker Release Dates",
    description:
      "Complete sneaker release calendar with Nike, Air Jordan, Yeezy, adidas, New Balance, Puma, ASICS, and more.",
    type: "sneakers",
  },
  {
    slug: "clothing",
    title: "Clothing Release Dates",
    description:
      "Upcoming streetwear and clothing release dates from SoleInsider's release archive.",
    type: "clothing",
  },
  {
    slug: "music",
    title: "Music Release Dates",
    description:
      "Upcoming music-related drops and release dates from the SoleInsider archive.",
    type: "music",
  },
] satisfies {
  slug: string;
  title: string;
  description: string;
  type: string;
}[];

export function getReleaseArchivePage(slug: string) {
  return releaseArchivePages.find((page) => page.slug === slug);
}

export function getSeoTitle(title: string) {
  return `${title} | ${siteName}`;
}

export function buildMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const url = `${siteUrl}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      images: image ? [{ url: image }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
