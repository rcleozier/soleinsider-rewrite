"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type LiveCountdownProps = {
  releaseDateCalendar: string;
  label?: string;
};

export function LiveCountdown({
  releaseDateCalendar,
  label = "Drops In",
}: LiveCountdownProps) {
  const releaseDate = useMemo(
    () => parseLegacyCalendarDate(releaseDateCalendar),
    [releaseDateCalendar],
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  const distance = releaseDate ? Math.max(0, releaseDate.getTime() - now) : 0;
  const parts = toParts(distance);
  const isElapsed = Boolean(releaseDate && releaseDate.getTime() <= now);

  return (
    <section className="countdown-module" aria-label={label}>
      <p>{isElapsed ? "Drop status" : label}</p>
      {releaseDate ? (
        <div className="countdown-grid">
          {parts.map((part, index) => (
            <div className="countdown-cell" key={part.label}>
              <strong>{part.value}</strong>
              <span>{part.label}</span>
              {index < parts.length - 1 ? <i aria-hidden="true">:</i> : null}
            </div>
          ))}
        </div>
      ) : (
        <strong className="countdown-state">Date TBA — get notified</strong>
      )}
      {isElapsed ? <span className="countdown-state">Drop is live or elapsed</span> : null}
      <Link className="countdown-reminder-link" href="/download">
        Get a release reminder
      </Link>
    </section>
  );
}

function parseLegacyCalendarDate(value: string) {
  const match = value.match(
    /^(\d{4}),(\d{1,2}),(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})/,
  );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match.map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}

function toParts(distance: number) {
  const totalSeconds = Math.floor(distance / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { label: "Days", value: String(days).padStart(2, "0") },
    { label: "Hrs", value: String(hours).padStart(2, "0") },
    { label: "Min", value: String(minutes).padStart(2, "0") },
    { label: "Sec", value: String(seconds).padStart(2, "0") },
  ];
}
