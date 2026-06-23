import Link from "next/link";
import Image from "next/image";
import { CopDropButtons } from "@/components/CopDropButtons";
import type { LegacyRelease } from "@/lib/legacyMobileApi";
import {
  formatReleaseDate,
  getBrandName,
  getReleaseImage,
  getReleaseUrl,
} from "@/lib/siteData";

export function ReleaseCard({ release }: { release: LegacyRelease }) {
  return (
    <article className="release-card">
      <Link href={getReleaseUrl(release)} className="release-card__media">
        <Image
          src={getReleaseImage(release)}
          alt={`${release.name} sneaker`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 33vw"
        />
        <span>{formatReleaseDate(release)}</span>
      </Link>
      <div className="release-card__body">
        <p>{getBrandName(release)}</p>
        <h2>
          <Link href={getReleaseUrl(release)}>{release.name}</Link>
        </h2>
        <dl>
          <div>
            <dt>Retail</dt>
            <dd>${Number(release.price).toLocaleString()}</dd>
          </div>
          <div>
            <dt>COP</dt>
            <dd>{release.yes_percentage}%</dd>
          </div>
        </dl>
        <CopDropButtons release={release} />
      </div>
    </article>
  );
}
