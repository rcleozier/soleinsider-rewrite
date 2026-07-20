import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getDbReleaseDatesUnformatted,
  getDbStatsMostProfit,
  getDbStatsMostSales,
} from "@/lib/dbMobileApi";
import type { LegacyRelease } from "@/lib/legacyMobileApi";
import {
  buildMetadata,
  getBrandName,
  getReleaseImage,
  getReleaseUrl,
  siteName,
  siteUrl,
} from "@/lib/siteData";

export const metadata: Metadata = buildMetadata({
  title: "Sneaker Market Data & Trends",
  description:
    "Track sneaker resale trends, high-volume releases, biggest gains over retail, and active products from the SoleInsider database.",
  path: "/market-data",
});

export const dynamic = "force-dynamic";

export default async function MarketDataPage() {
  const [topSales, biggestGains, releasePool] = await Promise.all([
    getDbStatsMostSales(),
    getDbStatsMostProfit(),
    getDbReleaseDatesUnformatted("sneakers", 500),
  ]);
  const mostTraded = [...releasePool]
    .filter((release) => getNumericValue(release.stockx_total_dollars) > 0)
    .sort(
      (a, b) =>
        getNumericValue(b.stockx_total_dollars) - getNumericValue(a.stockx_total_dollars),
    )
    .slice(0, 12);
  const activeProducts = releasePool.filter(
    (release) =>
      getNumericValue(release.stockx_lowest_ask) > 0 ||
      getNumericValue(release.stockx_sales_last_72) > 0,
  );
  const highestSales = topSales[0]?.stockx_sales_last_72 ?? "0";
  const averageGain = getAverageGain(activeProducts);
  const totalVolume = activeProducts.reduce(
    (sum, release) => sum + getNumericValue(release.stockx_total_dollars),
    0,
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteName} Sneaker Market Data`,
    url: `${siteUrl}/market-data`,
    mainEntity: mostTraded.slice(0, 20).map((release) => ({
      "@type": "Product",
      name: release.name,
      url: `${siteUrl}${getReleaseUrl(release)}`,
      image: getReleaseImage(release),
      sku: release.sku || undefined,
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="subpage-hero">
        <p className="kicker">Market data</p>
        <h1>Sneaker Market Data & Trends</h1>
        <p>
          Follow recent sales velocity, resale premiums, and trade volume across
          SoleInsider release pages.
        </p>
      </section>

      <section className="content-band market-data-page">
        <div className="market-insights">
          <MarketInsight label="Total tracked volume" value={formatMoney(totalVolume)} />
          <MarketInsight label="Average gain vs retail" value={formatPercent(averageGain)} />
          <MarketInsight label="Highest 72h sales" value={formatInteger(highestSales)} />
          <MarketInsight label="Active products" value={formatInteger(activeProducts.length)} />
        </div>

        <div className="market-data-grid">
          <MarketList
            title="Top Performers"
            eyebrow="Last 72h sales"
            releases={topSales.slice(0, 10)}
            metric={(release) => `${formatInteger(release.stockx_sales_last_72)} sales`}
          />
          <MarketList
            title="Biggest Gains"
            eyebrow="Vs retail"
            releases={biggestGains.slice(0, 10)}
            metric={(release) => formatMoney(getProfit(release))}
          />
          <MarketList
            title="Most Traded"
            eyebrow="Total volume"
            releases={mostTraded.slice(0, 10)}
            metric={(release) => formatMoney(release.stockx_total_dollars)}
          />
        </div>

        <p className="market-disclaimer">
          Market data is directional and may trail marketplace updates. Use each
          product detail page for the complete release context.
        </p>
      </section>
    </main>
  );
}

function MarketInsight({ label, value }: { label: string; value: string }) {
  return (
    <article>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function MarketList({
  title,
  eyebrow,
  releases,
  metric,
}: {
  title: string;
  eyebrow: string;
  releases: LegacyRelease[];
  metric: (release: LegacyRelease) => string;
}) {
  return (
    <section className="market-list">
      <p className="kicker">{eyebrow}</p>
      <h2>{title}</h2>
      <ol>
        {releases.map((release, index) => (
          <li key={`${release.product_id}-${release.id}`}>
            <span className="market-rank">{index + 1}</span>
            <Link className="market-row-media" href={getReleaseUrl(release)}>
              <Image
                src={getReleaseImage(release)}
                alt={release.name}
                width={72}
                height={72}
                sizes="72px"
              />
            </Link>
            <div>
              <p>{getBrandName(release)}</p>
              <h3>
                <Link href={getReleaseUrl(release)}>{release.name}</Link>
              </h3>
            </div>
            <strong>{metric(release)}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}

function getNumericValue(value: string | number | null | undefined) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getProfit(release: LegacyRelease) {
  return getNumericValue(release.stockx_lowest_ask) - getNumericValue(release.price);
}

function getAverageGain(releases: LegacyRelease[]) {
  const gains = releases
    .map((release) => {
      const retail = getNumericValue(release.price);
      if (retail <= 0) return null;
      return getProfit(release) / retail;
    })
    .filter((gain): gain is number => gain !== null);

  if (!gains.length) return 0;
  return gains.reduce((sum, gain) => sum + gain, 0) / gains.length;
}

function formatMoney(value: string | number | null | undefined) {
  const numeric = getNumericValue(value);

  if (!numeric) return "TBA";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatInteger(value: string | number | null | undefined) {
  return getNumericValue(value).toLocaleString("en-US");
}
