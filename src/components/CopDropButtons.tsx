import type { LegacyRelease } from "@/lib/legacyMobileApi";

export function CopDropButtons({ release }: { release: LegacyRelease }) {
  return (
    <div className="vote-actions" aria-label={`COP or DROP ${release.name}`}>
      <button type="button">
        <span aria-hidden="true">▲</span>
        COP
        <strong>{release.yes_votes}</strong>
      </button>
      <button type="button">
        <span aria-hidden="true">▼</span>
        DROP
        <strong>{release.no_votes}</strong>
      </button>
    </div>
  );
}
