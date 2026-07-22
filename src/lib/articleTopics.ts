// Seed catalog for auto-generated articles. Subjects × angles are combined,
// so this is not a list of 60 topics — it's 60 subjects × 5-6 angles each,
// giving several hundred unique combinations before anything repeats. Each
// combination's slug is deterministic, so `getAvailableTopics` can filter out
// anything already published without ever calling OpenAI to find that out.

export type ArticleCategory = "sports" | "authentication" | "lifestyle";

export type ArticleTopic = {
  category: ArticleCategory;
  subject: string;
  angle: string;
  slug: string;
  brief: string;
};

const sportsSubjects = [
  "LeBron James",
  "Kevin Durant",
  "Giannis Antetokounmpo",
  "Luka Doncic",
  "Jayson Tatum",
  "Stephen Curry",
  "Ja Morant",
  "Zion Williamson",
  "Devin Booker",
  "Anthony Edwards",
  "Donovan Mitchell",
  "Damian Lillard",
  "Kyrie Irving",
  "Victor Wembanyama",
  "Caitlin Clark",
  "A'ja Wilson",
  "Sabrina Ionescu",
  "Patrick Mahomes",
  "Travis Kelce",
  "Michael Jordan",
  "Kobe Bryant",
];

const sportsAngles: { angle: string; template: (subject: string) => string }[] = [
  {
    angle: "sneaker legacy",
    template: (s) =>
      `A feature on how ${s}'s signature or most-worn sneakers shaped their public image and connected with collectors. Cover their on-court shoe story, standout colorways, and why fans chase these pairs.`,
  },
  {
    angle: "rise story",
    template: (s) =>
      `A career-arc feature on ${s}: the early breaks, the doubters, and the moment they became a star — written for readers who follow both the sport and the sneaker culture around it.`,
  },
  {
    angle: "signature shoe breakdown",
    template: (s) =>
      `A deep dive on ${s}'s signature sneaker line (or most iconic model if they don't have one): design details, what makes it wearable on and off court, and where it sits in sneaker culture today.`,
  },
  {
    angle: "cultural impact",
    template: (s) =>
      `An essay on ${s}'s influence beyond their sport — fashion, media, business ventures — and how that crossover appeal shows up in sneaker and streetwear culture.`,
  },
  {
    angle: "draft to stardom",
    template: (s) =>
      `A retrospective on ${s}'s path from being drafted/discovered to becoming a household name, with attention to the gear and brand deals that came with it.`,
  },
];

const authenticationSubjects = [
  "Air Jordan 1 High",
  "Air Jordan 4",
  "Air Jordan 11",
  "Air Jordan 3",
  "Air Jordan 6",
  "Nike Dunk Low",
  "Nike SB Dunk",
  "Nike Air Force 1",
  "Nike Air Max 1",
  "Nike Air Max 97",
  "Nike Cortez",
  "Adidas Yeezy Boost 350",
  "Adidas Samba",
  "Adidas Ultraboost",
  "New Balance 550",
  "New Balance 990",
  "ASICS Gel-Kayano 14",
  "Converse Chuck 70",
  "Puma Suede Classic",
  "Reebok Club C",
];

const authenticationAngles: { angle: string; template: (subject: string) => string }[] = [
  {
    angle: "legit check guide",
    template: (s) =>
      `A practical, checklist-style guide to spotting a fake ${s}: stitching, materials, box/label details, sizing tags, and common mistakes counterfeiters make. Written for a buyer checking a pair before purchase.`,
  },
  {
    angle: "real vs fake comparison",
    template: (s) =>
      `A real-vs-fake comparison guide for the ${s} covering the specific details that differ between authentic pairs and replicas — logo placement, sole texture, stitch count, packaging.`,
  },
  {
    angle: "buyer scam warning",
    template: (s) =>
      `A buyer-beware guide about counterfeit ${s} pairs circulating on resale marketplaces: where fakes typically come from, red flags in listing photos, and safe ways to verify before paying.`,
  },
  {
    angle: "authentication guide",
    template: (s) =>
      `An authentication walkthrough for the ${s} aimed at collectors, covering what changed across retros/versions and how that affects what a "correct" pair should look like.`,
  },
];

const lifestyleSubjects = [
  "Rolex Submariner",
  "Omega Speedmaster",
  "Casio G-Shock",
  "Seiko 5",
  "Cartier Tank",
  "Carhartt WIP Detroit Jacket",
  "Patagonia Retro-X Fleece",
  "Stone Island Garment-Dyed Jacket",
  "The North Face Nuptse",
  "Levi's 501",
  "Champion Reverse Weave Hoodie",
  "Chrome Hearts Jewelry",
  "Gold Chain Layering",
  "Bucket Hats",
  "Baggy Denim",
  "Crossbody Bags",
  "Vintage Band Tees",
  "Cargo Pants",
];

const lifestyleAngles: { angle: string; template: (subject: string) => string }[] = [
  {
    angle: "why it became a staple",
    template: (s) =>
      `An explainer on how ${s} became a streetwear/collector staple — the origin, the moment it crossed over into style culture, and why it still sells today.`,
  },
  {
    angle: "buying guide",
    template: (s) =>
      `A practical buying guide for ${s}: what to look for, price ranges from entry to grail, and how to avoid overpaying for hype.`,
  },
  {
    angle: "is it worth the hype",
    template: (s) =>
      `A balanced "is it worth it" piece on ${s} — what justifies the price and reputation, and where it's genuinely overrated.`,
  },
  {
    angle: "how to style it",
    template: (s) =>
      `A styling guide on wearing ${s} as part of a sneaker-forward outfit, with a few concrete pairing examples.`,
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildTopics(
  category: ArticleCategory,
  subjects: string[],
  angles: { angle: string; template: (subject: string) => string }[],
): ArticleTopic[] {
  return subjects.flatMap((subject) =>
    angles.map(({ angle, template }) => ({
      category,
      subject,
      angle,
      slug: slugify(`${angle}-${subject}`),
      brief: template(subject),
    })),
  );
}

export function getAllTopics(): ArticleTopic[] {
  return [
    ...buildTopics("sports", sportsSubjects, sportsAngles),
    ...buildTopics("authentication", authenticationSubjects, authenticationAngles),
    ...buildTopics("lifestyle", lifestyleSubjects, lifestyleAngles),
  ];
}

export const categoryLabels: Record<ArticleCategory, string> = {
  sports: "Sports",
  authentication: "Authentication",
  lifestyle: "Lifestyle",
};
