import { appStoreUrl, googlePlayUrl } from "@/lib/siteData";

/**
 * Styled store buttons in the house design.
 *
 * These are NOT the official Apple / Google badge artwork — those are
 * trademark-controlled assets with their own usage rules. To ship the real
 * badges, drop them in /public and swap the markup here.
 */
export function StoreBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`store-badges ${className}`.trim()}>
      <a className="store-badge" href={appStoreUrl}>
        <AppleIcon />
        <span>
          <em>Download on the</em>
          <strong>App Store</strong>
        </span>
      </a>
      <a className="store-badge" href={googlePlayUrl}>
        <PlayIcon />
        <span>
          <em>Get it on</em>
          <strong>Google Play</strong>
        </span>
      </a>
    </div>
  );
}

export function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="currentColor">
      <path d="M16.4 12.8c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.6 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.6.7 2.8.7 1.2 0 1.9-1 2.6-2 .8-1.2 1.2-2.3 1.2-2.4-.1 0-2.2-.9-2.2-3.4zM14.3 6c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2z" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path d="M3.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1 9.3-9.3v-.2L3.6 2.3z" fill="#00D4FF" />
      <path d="M16.4 15.3l-3.1-3.1v-.2l3.1-3.1 3.7 2.1c1 .6 1 1.6 0 2.2l-3.7 2.1z" fill="#FFCE00" />
      <path d="M16.5 15.9L13.3 12.7l-9.2 9.3c.3.4.9.4 1.6 0l10.8-6.1" fill="#FF3A44" />
      <path d="M16.5 8.1L5.7 2c-.7-.4-1.3-.4-1.6 0l9.2 9.3 3.2-3.2z" fill="#00F076" />
    </svg>
  );
}
