import { CalendarMatchCell } from "@/app/components/calendar-match-cell";
import { MainNav } from "@/app/components/nav";
import { RefreshButton } from "@/app/components/refresh-button";
import { PlayoffAfficheCell } from "@/app/components/playoff-affiche-cell";
import type { QuickScoreMatch } from "@/app/components/standings-quick-score";
import { isAdminAuthenticated } from "@/lib/auth";
import { playoffCourt, playoffLocalTimeRangeLabel, playoffSetsLabelFr } from "@/lib/playoff-schedule";
import { terrainPillClasses } from "@/lib/terrain-styles";
import { getCurrentPlayingMatches } from "@/lib/current-playing";
import {
  getPlayoffAfficheRows,
  getResolvedMatches,
  getState,
  getTeamName,
  officialSeasonRows,
  timeToStartsAtIso,
} from "@/lib/tournament";

export const revalidate = 120;

/** Distinct from terrain column tints (accent/sky/sage) so the creneau actuel row reads clearly. */
const calendarCurrentRowClass =
  "bg-amber-50 ring-2 ring-inset ring-amber-400/90 shadow-[inset_3px_0_0_0_rgb(217,119,6)] hover:bg-amber-100/90";

const playoffsTemplate = [
  { stage: "Quart de finale 1", winnerTo: "Demi-finale 1", matchId: "QF1" },
  { stage: "Quart de finale 2", winnerTo: "Demi-finale 1", matchId: "QF2" },
  { stage: "Quart de finale 3", winnerTo: "Demi-finale 2", matchId: "QF3" },
  { stage: "Quart de finale 4", winnerTo: "Demi-finale 2", matchId: "QF4" },
  { stage: "Demi-finale 1", winnerTo: "Finale", matchId: "SF1" },
  { stage: "Demi-finale 2", winnerTo: "Finale", matchId: "SF2" },
  { stage: "Petite finale (3e place)", winnerTo: "3e place", matchId: "TP1" },
  { stage: "Finale", winnerTo: "Champion", matchId: "F1" },
] as const;

function formatTimeRange(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + 30;
  const startHours = Math.floor(startMinutes / 60);
  const endHours = Math.floor(endMinutes / 60);
  const startMins = startMinutes % 60;
  const endMins = endMinutes % 60;
  return `${String(startHours).padStart(2, "0")}:${String(startMins).padStart(2, "0")}-${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
}

function formatRoundLabel(roundIndex: number) {
  return `#${roundIndex}`;
}

type Resolved = ReturnType<typeof getResolvedMatches>[number];

function toQuickScoreMatch(m: Resolved | undefined): QuickScoreMatch | null {
  if (!m) return null;
  return {
    id: m.id,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
  };
}

export default async function CalendarPage() {
  const [state, isAdmin] = await Promise.all([getState(), isAdminAuthenticated()]);
  const matches = getResolvedMatches(state);
  const current = getCurrentPlayingMatches(state);
  const currentStartsAt = current.startsAt;
  const currentMatchIds = new Set(current.matches.map((m) => m.id));
  const byTimeAndCourt = new Map(matches.map((m) => [`${m.startsAt}-${m.court}`, m]));
  const playoffAfficheById = new Map(
    getPlayoffAfficheRows(state).map((row) => [row.matchId, row]),
  );

  return (
    <>
      <MainNav />
      <main className="mx-auto w-full max-w-[min(100%,92rem)] flex-1 space-y-10 px-4 py-8 sm:px-6 lg:px-10">
        <section className="space-y-2 border-b border-stk-navy/10 pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-medium uppercase tracking-wider text-stk-accent">Programme</p>
              <h1 className="text-3xl font-bold sm:text-4xl">Calendrier</h1>
              <p className="max-w-3xl text-stk-navy/75">
                Modele de calendrier de saison (six matchs par equipe), suivi d&apos;un tableau final a elimination directe pour
                le top 8. Scores affiches des qu&apos;ils sont saisis.
              </p>
            </div>
            <div className="shrink-0">
              <RefreshButton />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold sm:text-2xl">Saison</h2>
          <div className="overflow-x-auto rounded-2xl border border-stk-navy/10 bg-white/90 shadow-md shadow-stk-navy/[0.06] backdrop-blur-sm">
            <table className="w-full min-w-[84rem] border-collapse text-base">
              <thead className="text-left text-stk-navy">
                <tr className="bg-stk-navy/[0.07]">
                  <th className="whitespace-nowrap px-4 py-4 text-sm font-semibold sm:px-5 sm:py-4 sm:text-base">
                    Round
                  </th>
                  <th className="whitespace-nowrap px-4 py-4 text-sm font-semibold sm:px-5 sm:py-4 sm:text-base">
                    Horaire
                  </th>
                  <th className="bg-stk-accent/15 px-4 py-4 text-sm font-semibold sm:px-5 sm:py-4 sm:text-base">
                    Terrain 1
                  </th>
                  <th className="bg-stk-accent/15 px-4 py-4 text-sm font-semibold sm:px-5 sm:py-4 sm:text-base">
                    Arbitre
                  </th>
                  <th className="bg-stk-sky/50 px-4 py-4 text-sm font-semibold sm:px-5 sm:py-4 sm:text-base">
                    Terrain 2
                  </th>
                  <th className="bg-stk-sky/50 px-4 py-4 text-sm font-semibold sm:px-5 sm:py-4 sm:text-base">
                    Arbitre
                  </th>
                  <th className="bg-stk-sage/45 px-4 py-4 text-sm font-semibold sm:px-5 sm:py-4 sm:text-base">
                    Terrain 3
                  </th>
                  <th className="bg-stk-sage/45 px-4 py-4 text-sm font-semibold sm:px-5 sm:py-4 sm:text-base">
                    Arbitre
                  </th>
                  <th className="bg-stk-accent/10 px-4 py-4 text-sm font-semibold sm:px-5 sm:py-4 sm:text-base">
                    Repos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stk-navy/[0.06]">
                {officialSeasonRows.map((row, index) => {
                  const startsAt = timeToStartsAtIso(row.time);
                  const match1 = byTimeAndCourt.get(`${startsAt}-1`);
                  const match2 = byTimeAndCourt.get(`${startsAt}-2`);
                  const match3 = byTimeAndCourt.get(`${startsAt}-3`);
                  const isCurrentSeasonRow =
                    currentStartsAt !== null && currentStartsAt === startsAt;

                  return (
                    <tr
                      key={row.time}
                      className={
                        isCurrentSeasonRow ? calendarCurrentRowClass : "hover:bg-stk-sky/20"
                      }
                    >
                      <td className="whitespace-nowrap px-4 py-4 align-top font-semibold text-stk-navy sm:px-5 sm:py-5">
                        {formatRoundLabel(index + 1)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 align-top font-semibold sm:px-5 sm:py-5">
                        {formatTimeRange(row.time)}
                      </td>
                      <td className="bg-stk-accent/10 px-4 py-4 align-top sm:px-5 sm:py-5">
                        <CalendarMatchCell isAdmin={isAdmin} match={toQuickScoreMatch(match1)} />
                      </td>
                      <td className="bg-stk-accent/10 px-4 py-4 align-top text-stk-navy/85 sm:px-5 sm:py-5">
                        {match1?.refereeTeam ?? "—"}
                      </td>
                      <td className="bg-stk-sky/35 px-4 py-4 align-top sm:px-5 sm:py-5">
                        <CalendarMatchCell isAdmin={isAdmin} match={toQuickScoreMatch(match2)} />
                      </td>
                      <td className="bg-stk-sky/35 px-4 py-4 align-top text-stk-navy/85 sm:px-5 sm:py-5">
                        {match2?.refereeTeam ?? "—"}
                      </td>
                      <td className="bg-stk-sage/30 px-4 py-4 align-top sm:px-5 sm:py-5">
                        <CalendarMatchCell isAdmin={isAdmin} match={toQuickScoreMatch(match3)} />
                      </td>
                      <td className="bg-stk-sage/30 px-4 py-4 align-top text-stk-navy/85 sm:px-5 sm:py-5">
                        {match3?.refereeTeam ?? "—"}
                      </td>
                      <td className="bg-stk-accent/10 px-4 py-4 align-top text-stk-navy/85 sm:px-5 sm:py-5">
                        {row.rest.length ? row.rest.map((s) => getTeamName(state.slots, s)).join(", ") : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold sm:text-2xl">Phases finales (top 8)</h2>
          <p className="text-sm text-stk-navy/70 sm:text-base">
            Les affiches des quarts suivent le <strong className="font-semibold text-stk-navy">classement actuel</strong>{" "}
            (rangs 1 a 8), meme si tous les matchs de saison ne sont pas encore joues. Les demi-finales et la finale
            restent en <strong className="font-semibold text-stk-navy">Vainqueur QF / Vainqueur SF</strong> tant que les
            scores des rounds precedents ne sont pas saisis.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-stk-navy/10 bg-white/90 shadow-md shadow-stk-navy/[0.06] backdrop-blur-sm">
            <table className="w-full min-w-[68rem] border-collapse text-base">
              <thead className="text-left text-stk-navy">
                <tr className="bg-stk-navy/[0.07]">
                  <th className="whitespace-nowrap px-4 py-4 text-sm font-semibold sm:px-5 sm:py-4 sm:text-base">
                    Etape
                  </th>
                  <th className="whitespace-nowrap px-4 py-4 text-sm font-semibold sm:px-5 sm:py-4 sm:text-base">
                    Terrain
                  </th>
                  <th className="bg-stk-accent/15 px-4 py-4 text-sm font-semibold sm:px-5 sm:py-4 sm:text-base">
                    Affiche
                  </th>
                  <th className="bg-stk-accent/15 px-4 py-4 text-sm font-semibold sm:px-5 sm:py-4 sm:text-base">
                    Arbitre
                  </th>
                  <th className="bg-stk-sky/50 px-4 py-4 text-sm font-semibold sm:px-5 sm:py-4 sm:text-base">
                    Le vainqueur va en
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stk-navy/[0.06]">
                {playoffsTemplate.map((row) => {
                  const affiche = playoffAfficheById.get(row.matchId)!;
                  const court = playoffCourt(row.matchId);
                  const isPlayoffCurrentRow = currentMatchIds.has(row.matchId);
                  return (
                    <tr
                      key={row.stage}
                      className={
                        isPlayoffCurrentRow ? calendarCurrentRowClass : "hover:bg-stk-sky/20"
                      }
                    >
                      <td className="px-4 py-4 align-top font-semibold text-stk-navy sm:px-5 sm:py-5">
                        <span className="block whitespace-nowrap">{row.stage}</span>
                        <span className="mt-1 block text-sm font-normal leading-snug text-stk-navy/70">
                          {playoffLocalTimeRangeLabel(row.matchId)} · {playoffSetsLabelFr(row.matchId)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top sm:px-5 sm:py-5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${terrainPillClasses(court)}`}
                        >
                          Terrain {court}
                        </span>
                      </td>
                      <td className="bg-stk-accent/10 px-4 py-4 align-top sm:px-5 sm:py-5">
                        <PlayoffAfficheCell row={affiche} isAdmin={isAdmin} />
                      </td>
                      <td className="bg-stk-accent/10 px-4 py-4 align-top text-stk-navy/85 sm:px-5 sm:py-5">
                        {affiche.refereeTeam ?? "—"}
                      </td>
                      <td className="bg-stk-sky/35 px-4 py-4 align-top font-medium text-stk-navy/90 sm:px-5 sm:py-5">
                        {row.winnerTo}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
