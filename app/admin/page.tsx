import { isAdminAuthenticated } from "@/lib/auth";
import { MainNav } from "@/app/components/nav";
import { AdminDashboard } from "./admin-dashboard";
import { AdminLogin } from "./admin-login";
import {
  getEffectiveGroupEndIso,
  getEffectiveGroupStartIso,
  getOfficialTeamNames,
  getResolvedMatches,
  getState,
  officialSeasonRows,
} from "@/lib/tournament";
import { formatMatchTime } from "@/lib/montreal-time";

export default async function AdminPage() {
  const isAdmin = await isAdminAuthenticated();

  if (!isAdmin) {
    return (
      <>
        <MainNav />
        <main className="mx-auto min-w-0 w-full max-w-xl flex-1 space-y-8 px-4 py-8 sm:px-6">
          <section className="space-y-2 border-b border-stk-navy/10 pb-6">
            <p className="text-sm font-medium uppercase tracking-wider text-stk-accent">Restreint</p>
            <h1 className="text-3xl font-bold">Connexion admin</h1>
            <p className="text-sm text-stk-navy/70">Organisateurs uniquement — saisissez le mot de passe partage pour gerer le tirage et les scores.</p>
          </section>
          <AdminLogin />
        </main>
      </>
    );
  }

  const state = await getState();
  const matches = getResolvedMatches(state);

  const roundTimes = officialSeasonRows.map((row, index) => ({
    roundIndex: index,
    officialLocalTime: row.time,
    effectiveStartLocalTime: formatMatchTime(getEffectiveGroupStartIso(state, index)),
    effectiveEndLocalTime: formatMatchTime(getEffectiveGroupEndIso(state, index)),
    isOverridden: !!(state.groupRoundStarts?.[index]),
  }));

  return (
    <>
      <MainNav />
      <main className="mx-auto min-w-0 w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
        <section className="space-y-2 border-b border-stk-navy/10 pb-6">
          <p className="text-sm font-medium uppercase tracking-wider text-stk-accent">Organisation</p>
          <h1 className="text-3xl font-bold">Administration du tournoi</h1>
          <p className="text-stk-navy/75">Attribuez les equipes aux places et enregistrez les scores des matchs.</p>
        </section>
        <AdminDashboard
          slots={state.slots}
          matches={matches}
          officialTeamNames={getOfficialTeamNames()}
          roundTimes={roundTimes}
        />
      </main>
    </>
  );
}
