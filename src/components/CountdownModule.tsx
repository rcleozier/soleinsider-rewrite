type CountdownModuleProps = {
  releaseDateCalendar: string;
  label?: string;
};

export function CountdownModule({
  releaseDateCalendar,
  label = "Drops In",
}: CountdownModuleProps) {
  const parts = getCountdownParts(releaseDateCalendar);

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

function getCountdownParts(releaseDateCalendar: string) {
  const match = releaseDateCalendar.match(
    /^(\d{4}),(\d{1,2}),(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})/,
  );

  if (!match) {
    return toParts(0);
  }

  const [, year, month, day, hour, minute, second] = match.map(Number);
  const releaseDate = new Date(year, month - 1, day, hour, minute, second);
  const distance = Math.max(0, releaseDate.getTime() - Date.now());

  return toParts(distance);
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
