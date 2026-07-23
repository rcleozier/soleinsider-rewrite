import { prisma } from "@/lib/prisma";
import type { ArticleTopic } from "@/lib/articleTopics";
import { getProductImageUrl } from "@/lib/productImages";
import { uploadImageUrlToS3 } from "@/lib/s3";

// Retired/legend subjects whose signature shoes don't literally carry their
// name in our product catalog (unlike current stars — "Curry 12", "Kyrie 9",
// "Luka 3" all contain the surname already, so no alias is needed for them).
const LEGEND_SHOE_ALIASES: Record<string, string[]> = {
  "Michael Jordan": ["air jordan"],
  "Kobe Bryant": ["kobe"],
  "Allen Iverson": ["reebok question", "iverson"],
  "Shaquille O'Neal": ["shaq"],
  "Charles Barkley": ["barkley"],
  "Scottie Pippen": ["pippen"],
  "Penny Hardaway": ["penny", "foamposite"],
  "Grant Hill": ["grant hill"],
  "Vince Carter": ["vince carter", "shox"],
  "Tracy McGrady": ["mcgrady", "t-mac"],
  "Dwyane Wade": ["wade"],
  "Tim Duncan": ["duncan"],
  "Bo Jackson": ["air trainer", "bo jackson"],
};

/**
 * Real photography only, in priority order: our own product catalog (photos
 * we already have the right to use), then a free stock photo API if
 * configured. Returns null — never a fabricated image — when neither has a
 * usable match, so the caller can decide what to do (currently: fall back
 * to AI generation as a last resort).
 */
export async function findRealCoverImage(topic: ArticleTopic): Promise<string | null> {
  const productPhoto = await findProductPhoto(topic);

  if (productPhoto) {
    return productPhoto;
  }

  return fetchStockCoverImage(topic);
}

async function findProductPhoto(topic: ArticleTopic): Promise<string | null> {
  for (const term of searchTermsForSubject(topic.subject)) {
    const product = await prisma.product.findFirst({
      where: {
        name: { contains: term, mode: "insensitive" },
        image: { not: "" },
      },
      orderBy: { views: "desc" },
    });

    if (product?.image) {
      return getProductImageUrl(product.image);
    }
  }

  return null;
}

function searchTermsForSubject(subject: string) {
  const alias = LEGEND_SHOE_ALIASES[subject];

  if (alias) {
    return alias;
  }

  // Authentication/lifestyle subjects are already literal product names
  // ("Air Jordan 4", "Nike Dunk Low"). Sports subjects vary by which name a
  // signature line actually uses — usually the surname ("Curry", "Kyrie" is
  // itself a first name used as the line name), but sometimes the first name
  // (Nike's "Giannis Immortality" line uses his first name, not "Antetokounmpo").
  // Try every word, longest first, to prefer the more distinctive one and
  // skip anything too short/common to search safely (e.g. "Ja" from "Ja Morant").
  const words = subject
    .trim()
    .split(/\s+/)
    .filter((word) => word.length >= 3)
    .sort((a, b) => b.length - a.length);

  return [subject, ...words];
}

/** Pexels (free, instant API key) — used only when we have no real product photo to reuse. */
async function fetchStockCoverImage(topic: ArticleTopic): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    return null;
  }

  const query = encodeURIComponent(`${topic.subject} sneakers`);

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=landscape`,
      { headers: { Authorization: apiKey } },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      photos?: { src?: { large2x?: string; large?: string } }[];
    };
    const photoUrl = data.photos?.[0]?.src?.large2x || data.photos?.[0]?.src?.large;

    if (!photoUrl) {
      return null;
    }

    return await uploadImageUrlToS3(photoUrl);
  } catch (error) {
    console.warn("Unable to fetch Pexels cover image.", error);
    return null;
  }
}
