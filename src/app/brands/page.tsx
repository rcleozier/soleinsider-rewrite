import type { Metadata } from "next";
import Link from "next/link";
import { brandDirectory, groupBrandsByLetter } from "@/lib/brands";
import { buildMetadata } from "@/lib/siteData";

export const metadata: Metadata = buildMetadata({
  title: "Brands",
  description:
    "Every brand tracked in the SoleInsider release archive, from Air Jordan and Nike to Supreme, Palace, and Stüssy.",
  path: "/brands",
});

export default function BrandsPage() {
  const groups = groupBrandsByLetter(brandDirectory);

  return (
    <main className="editorial-home brands-page">
      <header className="ed-masthead">
        <p className="ed-cat">Release archive</p>
        <h1>Brands</h1>
        <p className="ed-deck">
          Every brand in the SoleInsider archive, A to Z. Pick one to see every
          release on file — retail prices, style codes, and dates.
        </p>
      </header>

      <nav className="brand-jump" aria-label="Jump to letter">
        {groups.map((group) => (
          <a href={`#letter-${group.letter}`} key={group.letter}>
            {group.letter}
          </a>
        ))}
      </nav>

      <div className="brand-groups">
        {groups.map((group) => (
          <section className="brand-group" id={`letter-${group.letter}`} key={group.letter}>
            <h2 className="brand-group__letter">{group.letter}</h2>
            <div className="brand-group__grid">
              {group.brands.map((brand) => (
                <Link href={brand.href ?? `/brands/${brand.slug}`} key={brand.slug}>
                  {brand.label}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
