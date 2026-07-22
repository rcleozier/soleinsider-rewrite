export type BrandDefinition = {
  slug: string;
  label: string;
  /** Substrings matched against product name (case-insensitive), unanchored. */
  patterns: string[];
  /**
   * Some brands already have a dedicated, SEO-established archive page
   * (e.g. /nike-releases). Those redirect from /brands/[slug] rather than
   * rendering a duplicate page.
   */
  href?: string;
};

// Patterns were checked against the live product table before inclusion —
// short or common words (e.g. "Anta", "UGG", "UA") were dropped because they
// false-matched unrelated names ("Atlanta", "Rugged", "McDonald's"). Keep that
// in mind before adding a new short brand name here: verify it doesn't collide.
export const brandDirectory: BrandDefinition[] = [
  { slug: "air-jordan", label: "Air Jordan", patterns: ["jordan"], href: "/air-jordan-releases" },
  { slug: "nike", label: "Nike", patterns: ["nike"], href: "/nike-releases" },
  { slug: "adidas", label: "adidas", patterns: ["adidas"], href: "/adidas-releases" },
  { slug: "yeezy", label: "Yeezy", patterns: ["yeezy"], href: "/yeezy-releases" },
  { slug: "new-balance", label: "New Balance", patterns: ["new balance"], href: "/new-balance-releases" },
  { slug: "puma", label: "Puma", patterns: ["puma"], href: "/puma-releases" },
  { slug: "asics", label: "ASICS", patterns: ["asics"], href: "/asics-releases" },
  { slug: "off-white", label: "Off-White", patterns: ["off-white", "off white"], href: "/off-white-releases" },

  { slug: "aime-leon-dore", label: "Aime Leon Dore", patterns: ["aime leon dore"] },
  { slug: "ambush", label: "Ambush", patterns: ["ambush"] },
  { slug: "awake-ny", label: "Awake NY", patterns: ["awake ny"] },
  { slug: "balenciaga", label: "Balenciaga", patterns: ["balenciaga"] },
  { slug: "bape", label: "BAPE", patterns: ["bape", "a bathing ape"] },
  { slug: "brain-dead", label: "Brain Dead", patterns: ["brain dead"] },
  { slug: "brooks", label: "Brooks", patterns: ["brooks"] },
  { slug: "carhartt", label: "Carhartt", patterns: ["carhartt"] },
  { slug: "cdg", label: "Comme des Garçons", patterns: ["cdg", "comme des garcons"] },
  { slug: "converse", label: "Converse", patterns: ["converse"] },
  { slug: "crocs", label: "Crocs", patterns: ["crocs"] },
  { slug: "diadora", label: "Diadora", patterns: ["diadora"] },
  { slug: "ewing", label: "Ewing Athletics", patterns: ["ewing"] },
  { slug: "fear-of-god", label: "Fear of God", patterns: ["fear of god"] },
  { slug: "fila", label: "Fila", patterns: ["fila"] },
  { slug: "human-made", label: "Human Made", patterns: ["human made"] },
  { slug: "jjjjound", label: "JJJJound", patterns: ["jjjjound"] },
  { slug: "kaws", label: "KAWS", patterns: ["kaws"] },
  { slug: "kith", label: "Kith", patterns: ["kith"] },
  { slug: "li-ning", label: "Li-Ning", patterns: ["li-ning"] },
  { slug: "neighborhood", label: "NEIGHBORHOOD", patterns: ["neighborhood"] },
  { slug: "north-face", label: "The North Face", patterns: ["north face"] },
  { slug: "onitsuka-tiger", label: "Onitsuka Tiger", patterns: ["onitsuka"] },
  { slug: "palace", label: "Palace", patterns: ["palace"] },
  { slug: "reebok", label: "Reebok", patterns: ["reebok"] },
  { slug: "sacai", label: "Sacai", patterns: ["sacai"] },
  { slug: "salomon", label: "Salomon", patterns: ["salomon"] },
  { slug: "saucony", label: "Saucony", patterns: ["saucony"] },
  { slug: "stone-island", label: "Stone Island", patterns: ["stone island"] },
  { slug: "stussy", label: "Stüssy", patterns: ["stussy"] },
  { slug: "supreme", label: "Supreme", patterns: ["supreme"] },
  { slug: "timberland", label: "Timberland", patterns: ["timberland"] },
  { slug: "under-armour", label: "Under Armour", patterns: ["under armour", "under amrmour"] },
  { slug: "undercover", label: "Undercover", patterns: ["undercover"] },
  { slug: "vans", label: "Vans", patterns: ["vans"] },
  { slug: "wtaps", label: "WTAPS", patterns: ["wtaps"] },
  { slug: "y-3", label: "Y-3", patterns: ["y-3"] },
];

export function getBrandDefinition(slug: string) {
  return brandDirectory.find((brand) => brand.slug === slug);
}

export type BrandLetterGroup = {
  letter: string;
  brands: BrandDefinition[];
};

export function groupBrandsByLetter(brands: BrandDefinition[]): BrandLetterGroup[] {
  const sorted = brands
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }));
  const groups = new Map<string, BrandDefinition[]>();

  for (const brand of sorted) {
    const firstChar = brand.label.trim()[0]?.toUpperCase() ?? "#";
    const letter = /[A-Z]/.test(firstChar) ? firstChar : "#";
    const existing = groups.get(letter);

    if (existing) {
      existing.push(brand);
    } else {
      groups.set(letter, [brand]);
    }
  }

  return Array.from(groups, ([letter, list]) => ({ letter, brands: list })).sort((a, b) =>
    a.letter === "#" ? 1 : b.letter === "#" ? -1 : a.letter.localeCompare(b.letter),
  );
}
