import type { Metadata } from "next";
import { getAllReleases, type LegacyRelease } from "@/lib/legacyMobileApi";
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

const articleImageReleases = getAllReleases();

function getMockReleaseImageByIndex(index: number) {
  const release = articleImageReleases[index % articleImageReleases.length];

  if (!release) {
    return getProductImageUrl(null);
  }

  return getProductImageUrl(release.image);
}

export const navigation = [
  { href: "/", label: "Release Dates" },
  { href: "/articles", label: "Stories" },
  { href: "/calendar", label: "Calendar" },
  { href: "/sneaker-history", label: "Sneaker History" },
  { href: "/market-data", label: "Market Data" },
  { href: "/on-this-day", label: "On This Day" },
];

export const articles: Article[] = [
  {
    slug: "spot-fake-supreme-hoodie",
    title: "How to tell if your Supreme hoodie is fake",
    deck: "A field guide to tags, stitching, drawcords, and the tells that separate real Supreme from a convincing replica.",
    author: "Rob",
    date: "2026-02-03",
    category: "Authentication",
    image: getMockReleaseImageByIndex(0),
    body: [
      "Counterfeit streetwear usually gets one or two obvious things right and then misses the quiet details. Start with the neck tag, wash tag, and box logo spacing before you look at the broader silhouette.",
      "The fastest checks are texture and consistency. Real pieces should have clean embroidery, balanced lettering, and hardware that feels substantial. Photos from sellers should include close-ups in daylight.",
      "When a price is far below the market, slow down. Compare the garment against recent verified sales and ask for timestamped photos before sending payment.",
    ],
  },
  {
    slug: "air-jordan-1-authentication-guide",
    title: "How to tell if your Air Jordan 1s are fake",
    deck: "A practical authentication checklist for shape, leather, wings logos, box labels, and outsole details.",
    author: "Rob",
    date: "2026-08-07",
    category: "Air Jordan",
    image: getMockReleaseImageByIndex(1),
    body: [
      "Air Jordan 1 authentication starts with shape. The collar height, toe box slope, and heel curve should look balanced before you even get into labels.",
      "Inspect the wings logo and tongue tag next. Replicas often have uneven embossing, inconsistent thread density, or spacing that feels slightly compressed.",
      "A clean pair of photos is more useful than a dramatic angle. Ask for the box label, outsole, insole stitching, and both shoes side by side.",
    ],
  },
  {
    slug: "yeezy-350-v2-authentication",
    title: "How to tell if your Yeezy 350 V2 are fake",
    deck: "Primeknit pattern, heel tab placement, boost texture, and box label clues for Yeezy buyers.",
    author: "Rob",
    date: "2026-02-03",
    category: "Yeezy",
    image: getMockReleaseImageByIndex(2),
    body: [
      "Yeezy 350 V2 checks are about pattern rhythm. The knit should line up cleanly from side to side, especially around the stripe and heel.",
      "Look at the boost window, outsole translucency, and heel tab angle. Fake pairs often feel too rigid or show messy glue around high-stress seams.",
      "For resale, match the box label to the shoe tag and confirm the size tag typography against trusted references.",
    ],
  },
  {
    slug: "flipping-sneakers-release-calendar",
    title: "Guide to flipping and reselling sneakers",
    deck: "How to use release dates, demand signals, and sell-through data without chasing every drop.",
    author: "Rob",
    date: "2026-09-27",
    category: "Market",
    image: getMockReleaseImageByIndex(3),
    body: [
      "Good resale strategy starts before release day. Track calendar density, brand heat, sizes with stronger liquidity, and whether early pairs are moving above retail.",
      "Avoid treating every limited pair the same. Some shoes spike immediately, while others need time for inventory to settle and attention to return.",
      "The best edge is organization: release reminders, retail links, market comps, and a clear exit price before checkout.",
    ],
  },
];

export function getReleaseImage(release: LegacyRelease) {
  return getProductImageUrl(release.image);
}

export function getReleaseUrl(release: LegacyRelease) {
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

export function getEditorialReleases() {
  return getAllReleases().sort(
    (a, b) =>
      new Date(a.created_at.replace(" ", "T")).getTime() -
      new Date(b.created_at.replace(" ", "T")).getTime(),
  );
}
