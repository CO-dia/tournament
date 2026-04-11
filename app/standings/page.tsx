export const revalidate = 120;

import { MainNav } from "@/app/components/nav";
import { RefreshButton } from "@/app/components/refresh-button";
import { StandingsQuickScore } from "@/app/components/standings-quick-score";
import { isAdminAuthenticated } from "@/lib/auth";
import { formatMatchTime } from "@/lib/montreal-time";
import { getResolvedMatches, getStandings, getState } from "@/lib/tournament";

export default async function StandingsPage() {
  const [state, isAdmin] = await Promise.all([getState(), isAdminAuthenticated()]);
  const standings = getStandings(state);
  const matches = getResolvedMatches(state);
  const quickScoreMatches = matches.map((m) => ({
    id: m.id,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
  }));
  const matchLabel = new Map(matches.map((m) => [m.id, `${m.homeTeam} vs ${m.awayTeam}`]));
  const history = [...(state.scoreHistory ?? [])].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );

  return (
    <>
      <MainNav />
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-8 sm:px-6">
        <section className="space-y-2 border-b border-stk-navy/10 pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-medium uppercase tracking-wider text-stk-accent">Classement</p>
              <h1 className="text-3xl font-bold sm:text-4xl">Classement</h1>
              <p className="text-stk-navy/75">
                Les <strong className="font-semibold text-stk-navy">points</strong> comptent la somme des points marqués
                dans chaque match (total sur le tournoi). Classement par total de points marqués, puis différence, puis
                matchs gagnés.
              </p>
            </div>
            <div className="flex shrink-0 items-start gap-2">
              <RefreshButton />
              {isAdmin ? <StandingsQuickScore matches={quickScoreMatches} /> : null}
            </div>
          </div>
        </section>

        <div className="overflow-x-auto rounded-2xl border border-stk-navy/10 bg-white/90 shadow-md shadow-stk-navy/[0.06] backdrop-blur-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-stk-navy/[0.07] text-left text-stk-navy">
              <tr>
                <th className="px-4 py-3 font-semibold">Rang</th>
                <th className="px-4 py-3 font-semibold">Equipe</th>
                <th className="px-4 py-3 font-semibold" title="Total des points marqués (tous matchs)">
                  Pts marqués
                </th>
                <th className="px-4 py-3 font-semibold">Joues</th>
                <th className="px-4 py-3 font-semibold">Gagnes</th>
                <th className="px-4 py-3 font-semibold">Perdus</th>
                <th className="px-4 py-3 font-semibold">Diff. points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stk-navy/[0.06]">
              {standings.map((row, index) => (
                <tr key={row.slot} className="transition-colors hover:bg-stk-sky/25">
                  <td className="px-4 py-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-stk-navy/10 text-sm font-bold text-stk-navy">
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-stk-navy">{row.team}</td>
                  <td className="px-4 py-3 tabular-nums font-semibold">{row.scoreFor}</td>
                  <td className="px-4 py-3 tabular-nums text-stk-navy/85">{row.played}</td>
                  <td className="px-4 py-3 tabular-nums text-stk-sage">{row.won}</td>
                  <td className="px-4 py-3 tabular-nums text-stk-accent/90">{row.lost}</td>
                  <td className="px-4 py-3 tabular-nums font-medium text-stk-navy">{row.scoreFor - row.scoreAgainst}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Historique des scores</h2>
          <p className="text-sm text-stk-navy/75">
            Chaque saisie ou modification dans l&apos;admin est enregistrée (plus récent en premier). Utile pour verifier
            les totaux.
          </p>
          {history.length === 0 ? (
            <p className="rounded-xl border border-stk-navy/10 bg-stk-sky/20 px-4 py-3 text-sm text-stk-navy/80">
              Aucun score enregistre pour l&apos;instant.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-stk-navy/10 bg-white/90 shadow-md shadow-stk-navy/[0.06] backdrop-blur-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-stk-navy/[0.07] text-left text-stk-navy">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Heure</th>
                    <th className="px-4 py-3 font-semibold">Match</th>
                    <th className="px-4 py-3 font-semibold">Score enregistré</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stk-navy/[0.06]">
                  {history.map((entry, index) => (
                    <tr key={`${entry.matchId}-${entry.recordedAt}-${index}`} className="hover:bg-stk-sky/25">
                      <td className="whitespace-nowrap px-4 py-3 text-stk-navy/90">{formatMatchTime(entry.recordedAt)}</td>
                      <td className="px-4 py-3 text-stk-navy">
                        <span className="font-mono text-xs text-stk-navy/50">{entry.matchId}</span>
                        <span className="mx-2 text-stk-navy/30">·</span>
                        {matchLabel.get(entry.matchId) ?? entry.matchId}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium">
                        {entry.homeScore} – {entry.awayScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
