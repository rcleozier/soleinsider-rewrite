"use client";

import { useState } from "react";
import Link from "next/link";

type CountdownModuleProps = {
  releaseDateCalendar: string;
  label?: string;
};

export function CountdownModule({
  releaseDateCalendar,
  label = "Drops In",
}: CountdownModuleProps) {
  const [now] = useState(() => Date.now());
  const releaseDate = parseLegacyCalendarDate(releaseDateCalendar);

  if (!releaseDate) {
    return <CountdownTbaState label={label} />;
  }

  const distance = releaseDate.getTime() - now;

  if (distance <= 0) {
    return (
      <section className="countdown-module countdown-module--state" aria-label={label}>
        <p>Drop status</p>
        <strong className="countdown-state">Drop is live or elapsed</strong>
        <Link href="/calendar">Get notified for the next drop</Link>
      </section>
    );
  }

  const parts = toParts(distance);

  return (
    <section className="countdown-module" aria-label={label}>
      <p>{label}</p>
      <div className="countdown-grid">
        {parts.map((part, index) => (
          <div className="countdown-cell" key={part.label}>
            <strong>{part.value}</strong>
            <span>{part.label}</span>
            {index < parts.length - 1 ? <i aria-hidden="true">:</i> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function CountdownTbaState({ label }: { label: string }) {
  return (
    <section className="countdown-module countdown-module--state" aria-label={label}>
      <p>{label}</p>
      <strong className="countdown-state">Date TBA — get notified</strong>
      <form>
        <input type="email" placeholder="Email for drop alerts" aria-label="Email for drop alerts" />
        <button type="submit">Notify me</button>
      </form>
    </section>
  );
}

function parseLegacyCalendarDate(releaseDateCalendar: string) {
  const match = releaseDateCalendar.match(
    /^(\d{4}),(\d{1,2}),(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})/,
  );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match.map(Number);
  const releaseDate = new Date(year, month - 1, day, hour, minute, second);

  if (year < 2000 || Number.isNaN(releaseDate.getTime())) {
    return null;
  }

  return releaseDate;
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
