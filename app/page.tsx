import Link from "next/link";
import { MainNav } from "@/app/components/nav";
import { MatchTable } from "@/app/components/match-table";
import { TeamNextGames } from "@/app/components/team-next-games";
import { getResolvedMatches, getStandings, getState } from "@/lib/tournament";

export default async function Home() {
  const state = await getState();
  const matches = getResolvedMatches(state);
  const standings = getStandings(state);
  const upcoming = matches.filter((match) => match.homeScore === null || match.awayScore === null).slice(0, 8);

  return (
    <>
      <MainNav />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-8 sm:px-6">
        <section className="relative overflow-hidden rounded-3xl border border-stk-navy/10 bg-white/70 px-6 py-8 shadow-lg shadow-stk-navy/[0.07] backdrop-blur-sm sm:px-10 sm:py-10">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-stk-accent/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-stk-sage/30 blur-3xl"
            aria-hidden
          />
          <div className="relative space-y-4">
            <p className="text-sm font-medium uppercase tracking-wider text-stk-accent">Tableau de bord</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tournoi de volley-ball</h1>
            <p className="max-w-2xl text-base leading-relaxed text-stk-navy/75">
              Calendrier en direct, matchs a venir et classement de notre ligue STK. Utilisez les liens ci-dessous pour
              la vue complete.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                className="inline-flex items-center rounded-full bg-stk-navy px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-stk-navy/90"
                href="/calendar"
              >
                Calendrier complet
              </Link>
              <Link
                className="inline-flex items-center rounded-full border border-stk-accent/35 bg-stk-accent/10 px-4 py-2 text-sm font-medium text-stk-navy transition hover:bg-stk-accent/20"
                href="/standings"
              >
                Classement complet
              </Link>
            </div>
          </div>
        </section>

        <TeamNextGames slots={state.slots} matches={matches} />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Matchs a venir</h2>
          <MatchTable matches={upcoming} />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Top 5 du classement</h2>
          <p className="text-sm text-stk-navy/65">Pts = total des points marqués sur tous les matchs joués.</p>
          <div className="overflow-x-auto rounded-2xl border border-stk-navy/10 bg-white/90 shadow-md shadow-stk-navy/[0.06] backdrop-blur-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-stk-navy/[0.07] text-left text-stk-navy">
                <tr>
                  <th className="px-4 py-3 font-semibold">Equipe</th>
                  <th className="px-4 py-3 font-semibold">Pts marqués</th>
                  <th className="px-4 py-3 font-semibold">J</th>
                  <th className="px-4 py-3 font-semibold">G</th>
                  <th className="px-4 py-3 font-semibold">P</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stk-navy/[0.06]">
                {standings.slice(0, 5).map((row, index) => (
                  <tr key={row.slot} className="transition-colors hover:bg-stk-sky/25">
                    <td className="px-4 py-3">
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-stk-navy/10 text-xs font-bold text-stk-navy">
                        {index + 1}
                      </span>
                      <span className="font-medium">{row.team}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-stk-navy">{row.scoreFor}</td>
                    <td className="px-4 py-3 tabular-nums text-stk-navy/85">{row.played}</td>
                    <td className="px-4 py-3 tabular-nums text-stk-sage">{row.won}</td>
                    <td className="px-4 py-3 tabular-nums text-stk-accent/90">{row.lost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
