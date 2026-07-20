import Link from "next/link";
import Image from "next/image";
import { CopDropButtons } from "@/components/CopDropButtons";
import type { LegacyRelease } from "@/lib/legacyMobileApi";
import {
  cleanHtmlContent,
  formatReleaseDate,
  getBrandName,
  getReleaseImage,
  getReleaseUrl,
} from "@/lib/siteData";

export function ReleaseCard({
  release,
  priority = false,
  featured = false,
}: {
  release: LegacyRelease;
  priority?: boolean;
  featured?: boolean;
}) {
  const description = cleanHtmlContent(release.content);

  return (
    <article className={featured ? "release-card release-card--featured" : "release-card"}>
      <Link href={getReleaseUrl(release)} className="release-card__media">
        <Image
          src={getReleaseImage(release)}
          alt={`${release.name} sneaker`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 33vw"
          priority={priority}
        />
        <span>{formatReleaseDate(release)}</span>
      </Link>
      <div className="release-card__body">
        <p>{getBrandName(release)}</p>
        <h2>
          <Link href={getReleaseUrl(release)}>{release.name}</Link>
        </h2>
        {featured && description ? <p className="release-card__dek">{description}</p> : null}
        <dl>
          <div>
            <dt>Retail</dt>
            <dd>{formatRetailPrice(release.price)}</dd>
          </div>
        </dl>
        <CopDropButtons release={release} showPercentages={false} />
      </div>
    </article>
  );
}

function formatRetailPrice(price: string) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return "TBA";
  }

  return `$${numericPrice.toLocaleString()}`;
}
