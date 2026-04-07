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
