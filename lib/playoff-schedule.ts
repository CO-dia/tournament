/**
 * Playoff wall times (America/Montreal, 2026-04-12) — same UTC offset convention as `timeToStartsAtIso` for saison.
 */
const PLAYOFF_DATE_UTC = { y: 2026, m: 3, d: 12 } as const;

function montrealLocalToIso(hours: number, minutes: number): string {
  const utcMs = Date.UTC(PLAYOFF_DATE_UTC.y, PLAYOFF_DATE_UTC.m, PLAYOFF_DATE_UTC.d, hours + 4, minutes, 0, 0);
  return new Date(utcMs).toISOString();
}

/** Start of the scheduled window for each bracket match (for sorting and “à partir de”). */
export function playoffMatchStartIso(matchId: string): string {
  const start: Record<string, [number, number]> = {
    QF1: [15, 15],
    QF2: [15, 15],
    QF3: [15, 45],
    QF4: [15, 45],
    SF1: [16, 15],
    SF2: [16, 15],
    F1: [17, 0],
  };
  const [h, min] = start[matchId] ?? [15, 15];
  return montrealLocalToIso(h, min);
}

/** Terrain 1: quarts (1) et (3), demi-finale (1), finale. Terrain 2: le reste. */
export function playoffCourt(matchId: string): 1 | 2 {
  if (matchId === "QF1" || matchId === "QF3" || matchId === "SF1" || matchId === "F1") {
    return 1;
  }
  return 2;
}

/** Display like `15:15–15:45` (local Montréal). */
export function playoffLocalTimeRangeLabel(matchId: string): string {
  const ranges: Record<string, [string, string]> = {
    QF1: ["15:15", "15:45"],
    QF2: ["15:15", "15:45"],
    QF3: ["15:45", "16:15"],
    QF4: ["15:45", "16:15"],
    SF1: ["16:15", "17:00"],
    SF2: ["16:15", "17:00"],
    F1: ["17:00", "17:45"],
  };
  const [a, b] = ranges[matchId] ?? ["", ""];
  return `${a}–${b}`;
}

export function playoffSetsLabelFr(matchId: string): string {
  if (matchId.startsWith("QF")) {
    return "1 set";
  }
  if (matchId.startsWith("SF")) {
    return "2 sets, 1 set supplémentaire (en cas d'égalité)";
  }
  if (matchId === "F1") {
    return "2 sets, 1 set supplémentaire (en cas d'égalité)";
  }
  return "";
}

/** Phase column / calendrier: French label with window + format des sets. */
export function formatPlayoffPhaseDetailFr(match: { id: string; phase: string }): string {
  if (match.phase === "group") {
    return "Saison";
  }
  const time = playoffLocalTimeRangeLabel(match.id);
  const sets = playoffSetsLabelFr(match.id);
  const stage =
    match.phase === "quarter"
      ? "Quarts de finale"
      : match.phase === "semi"
        ? "Demi-finale"
        : "Finale";
  return `${stage} · ${time} · ${sets}`;
}
