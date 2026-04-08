/** Shared with client components — must not import Node-only modules. */

export type PlayoffAfficheRow = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  refereeTeam: string | null;
};

/** True when both sides are known teams (not "Vainqueur QF1" style placeholders). */
export function isPlayoffScoreRowEditable(row: PlayoffAfficheRow): boolean {
  return (
    !row.homeTeam.startsWith("Vainqueur") &&
    !row.awayTeam.startsWith("Vainqueur") &&
    !row.homeTeam.startsWith("Perdant") &&
    !row.awayTeam.startsWith("Perdant")
  );
}
