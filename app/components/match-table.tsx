type ResolvedMatch = {
  id: string;
  phase: string;
  startsAt: string;
  court: number;
  homeTeam: string;
  awayTeam: string;
  refereeTeam: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

export function MatchTable({ matches }: { matches: ResolvedMatch[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-stk-navy/10 bg-white/90 shadow-md shadow-stk-navy/[0.06] backdrop-blur-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-stk-navy/[0.07] text-left text-stk-navy">
          <tr>
            <th className="px-4 py-3 font-semibold">Heure</th>
            <th className="px-4 py-3 font-semibold">Terrain</th>
            <th className="px-4 py-3 font-semibold">Match</th>
            <th className="px-4 py-3 font-semibold">Arbitre</th>
            <th className="px-4 py-3 font-semibold">Score</th>
            <th className="px-4 py-3 font-semibold">Phase</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stk-navy/[0.06]">
          {matches.map((match) => (
            <tr key={match.id} className="transition-colors hover:bg-stk-sky/25">
              <td className="whitespace-nowrap px-4 py-3 text-stk-navy/90">{formatDateTime(match.startsAt)}</td>
              <td className="px-4 py-3">
                <span className="inline-flex rounded-full bg-stk-sage/40 px-2.5 py-0.5 text-xs font-medium text-stk-navy">
                  Terrain {match.court}
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-stk-navy">
                {match.homeTeam} <span className="font-normal text-stk-navy/50">vs</span> {match.awayTeam}
              </td>
              <td className="px-4 py-3 text-stk-navy/75">{match.refereeTeam ?? "—"}</td>
              <td className="px-4 py-3 tabular-nums text-stk-navy">
                {match.homeScore !== null && match.awayScore !== null
                  ? `${match.homeScore} – ${match.awayScore}`
                  : "—"}
              </td>
              <td className="px-4 py-3 capitalize text-stk-navy/80">{match.phase}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
