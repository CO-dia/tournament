/** Scheduled match times are interpreted in this zone (see `timeToStartsAtIso` in `tournament.ts`). */
export const EVENT_TIME_ZONE = "America/Montreal";

/** Time of day only (24 h, HH:MM), no date — same style as the calendrier Horaire column. */
export function formatMatchTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("sv-SE", {
    timeZone: EVENT_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Same style as the calendrier saison column (30 min after start, local Montréal). */
export function formatGroupSlotRange(startIso: string): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const opts = {
    timeZone: EVENT_TIME_ZONE,
    hour: "2-digit" as const,
    minute: "2-digit" as const,
    hour12: false,
  };
  const a = start.toLocaleTimeString("sv-SE", opts);
  const b = end.toLocaleTimeString("sv-SE", opts);
  return `${a}–${b}`;
}
