"use client";

import { useMemo, useState } from "react";
import type { Match, TeamSlot } from "@/lib/tournament";

type RoundTimeInfo = {
  roundIndex: number;
  officialLocalTime: string;
  effectiveStartLocalTime: string;
  effectiveEndLocalTime: string;
  isOverridden: boolean;
};

type AdminDashboardProps = {
  slots: TeamSlot[];
  officialTeamNames: string[];
  matches: Array<
    Match & {
      homeTeam: string;
      awayTeam: string;
      refereeTeam: string | null;
    }
  >;
  roundTimes: RoundTimeInfo[];
};

type Message = {
  type: "success" | "error";
  text: string;
};

function selectableTeamsForSlot(
  officialTeamNames: string[],
  assignments: Record<number, string>,
  slotNumber: number,
): string[] {
  const current = (assignments[slotNumber] ?? "").trim();
  const takenElsewhere = new Set(
    Object.entries(assignments)
      .filter(
        ([key, value]) => Number(key) !== slotNumber && (value ?? "").trim(),
      )
      .map(([, value]) => (value ?? "").trim()),
  );
  return officialTeamNames.filter(
    (name) => !takenElsewhere.has(name) || name === current,
  );
}

const inputClass =
  "min-w-0 w-full rounded-xl border border-stk-navy/15 bg-white px-3 py-2 text-sm text-stk-navy outline-none ring-stk-accent/30 transition-shadow focus:ring-2";
const sectionClass =
  "min-w-0 rounded-2xl border border-stk-navy/10 bg-white/90 p-5 shadow-md shadow-stk-navy/[0.06] backdrop-blur-sm";

export function AdminDashboard({
  slots,
  officialTeamNames,
  matches,
  roundTimes,
}: AdminDashboardProps) {
  const [assignments, setAssignments] = useState<Record<number, string>>(
    Object.fromEntries(
      slots.map((slot) => [slot.slot, slot.assignedName ?? ""]),
    ),
  );
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id ?? "");
  const [homeScore, setHomeScore] = useState("0");
  const [awayScore, setAwayScore] = useState("0");
  const [message, setMessage] = useState<Message | null>(null);
  const [pending, setPending] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearPending, setClearPending] = useState(false);

  // Round-time editor state
  const [editingRound, setEditingRound] = useState<number | null>(null);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [rescheduleMessage, setRescheduleMessage] = useState<Message | null>(null);
  const [reschedulePending, setReschedulePending] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const hasAnyOverride = roundTimes.some((r) => r.isOverridden);

  function openRoundEditor(round: RoundTimeInfo) {
    setEditingRound(round.roundIndex);
    setEditStartTime(round.effectiveStartLocalTime);
    setEditEndTime(round.effectiveEndLocalTime);
    setRescheduleMessage(null);
  }

  async function applyRoundTime() {
    if (editingRound === null) return;
    setReschedulePending(true);
    setRescheduleMessage(null);
    try {
      const response = await fetch("/api/admin/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundIndex: editingRound,
          newStartTime: editStartTime,
          newEndTime: editEndTime,
        }),
      });
      if (!response.ok) throw new Error("Echec");
      setRescheduleMessage({ type: "success", text: "Horaire mis a jour." });
      setEditingRound(null);
      window.location.reload();
    } catch {
      setRescheduleMessage({ type: "error", text: "Echec de la mise a jour." });
    } finally {
      setReschedulePending(false);
    }
  }

  async function resetAllTimes() {
    setReschedulePending(true);
    setRescheduleMessage(null);
    try {
      const response = await fetch("/api/admin/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      if (!response.ok) throw new Error("Echec");
      setResetConfirmOpen(false);
      window.location.reload();
    } catch {
      setRescheduleMessage({ type: "error", text: "Echec de la reinitialisation." });
    } finally {
      setReschedulePending(false);
    }
  }

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId),
    [matches, selectedMatchId],
  );

  async function saveDraw() {
    setPending(true);
    setMessage(null);
    try {
      const payload = Object.fromEntries(
        Object.entries(assignments).map(([slot, name]) => [
          Number(slot),
          name.trim() || null,
        ]),
      );

      const response = await fetch("/api/admin/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments: payload }),
      });
      if (!response.ok) {
        throw new Error("Could not save draw");
      }

      setMessage({ type: "success", text: "Tirage enregistre." });
    } catch {
      setMessage({
        type: "error",
        text: "Echec de l'enregistrement du tirage.",
      });
    } finally {
      setPending(false);
    }
  }

  async function saveScore() {
    if (!selectedMatchId) return;

    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedMatchId,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
        }),
      });
      if (!response.ok) {
        throw new Error("Could not save score");
      }

      setMessage({ type: "success", text: "Score enregistré." });
      setSelectedMatchId(matches[0]?.id ?? "");
      setHomeScore("");
      setAwayScore("");
    } catch {
      setMessage({
        type: "error",
        text: "Echec de l'enregistrement du score.",
      });
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  async function confirmClearScores() {
    setClearPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/clear-scores", { method: "POST" });
      if (!response.ok) {
        throw new Error("Could not clear scores");
      }
      setClearModalOpen(false);
      window.location.reload();
    } catch {
      setMessage({
        type: "error",
        text: "Echec de la suppression des scores.",
      });
    } finally {
      setClearPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className={sectionClass}>
        <h2 className="text-xl font-semibold">Gestion du tirage</h2>
        <p className="mt-1 text-sm text-stk-navy/70">
          Liste de reference des equipes ci-dessous. Attribuez chaque equipe a
          une place (1) a (9) le jour J — chaque menu ne propose que les equipes
          pas encore choisies ailleurs.
        </p>

        <div className="mt-5 rounded-xl border border-stk-navy/10 bg-stk-sky/20 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-stk-navy/70">
            Equipes
          </p>
          <ul className="mt-2 grid gap-1.5 text-sm text-stk-navy sm:grid-cols-2 lg:grid-cols-3">
            {officialTeamNames.map((name) => (
              <li key={name} className="flex gap-2">
                <span className="text-stk-navy/40" aria-hidden>
                  •
                </span>
                <span>{name}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 text-sm font-medium text-stk-navy">
          Places du tirage
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot) => {
            const current = (assignments[slot.slot] ?? "").trim();
            let options = selectableTeamsForSlot(
              officialTeamNames,
              assignments,
              slot.slot,
            );
            if (current && !officialTeamNames.includes(current)) {
              options = [current, ...options];
            }

            return (
              <label key={slot.slot} className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-stk-navy">
                  Place ({slot.slot})
                </span>
                <select
                  className={inputClass}
                  value={current}
                  onChange={(event) =>
                    setAssignments((currentMap) => ({
                      ...currentMap,
                      [slot.slot]: event.target.value,
                    }))
                  }
                >
                  <option value="">— Non assigne —</option>
                  {options.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>

        <button
          type="button"
          onClick={saveDraw}
          disabled={pending}
          className="mt-6 w-full rounded-full bg-stk-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stk-navy/90 disabled:opacity-60 sm:w-auto"
        >
          Enregistrer le tirage
        </button>
      </section>

      <section className={sectionClass}>
        <h2 className="text-xl font-semibold">Saisie des scores</h2>
        <p className="mt-1 text-sm text-stk-navy/70">
          Seuls les admins peuvent modifier les scores des matchs.
        </p>

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <label className="flex min-w-0 flex-col gap-1.5 text-sm">
            <span className="font-medium text-stk-navy">Match</span>
            <select
              className={inputClass}
              value={selectedMatchId}
              onChange={(event) => setSelectedMatchId(event.target.value)}
            >
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.id} — {match.homeTeam} vs {match.awayTeam}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-0 flex-col gap-1.5 text-sm">
            <span className="min-w-0 font-medium text-stk-navy">
              {selectedMatch?.homeTeam ?? "Domicile"}
            </span>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={homeScore}
              onChange={(event) => setHomeScore(event.target.value)}
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1.5 text-sm">
            <span className="min-w-0 font-medium text-stk-navy">
              {selectedMatch?.awayTeam ?? "Exterieur"}
            </span>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={awayScore}
              onChange={(event) => setAwayScore(event.target.value)}
            />
          </label>

          <button
            type="button"
            onClick={saveScore}
            disabled={pending || !selectedMatchId}
            className="w-full shrink-0 rounded-full bg-stk-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stk-accent/90 disabled:opacity-60 sm:w-auto sm:justify-self-end"
          >
            Enregistrer le score
          </button>
        </div>

        <div className="mt-6 border-t border-stk-navy/10 pt-5">
          <p className="text-sm font-medium text-stk-navy">Zone sensible</p>
          <p className="mt-1 text-sm text-stk-navy/70">
            Supprime tous les scores sur les matchs et l&apos;integralite de
            l&apos;historique des scores (meme action que pour le classement et
            le calendrier).
          </p>
          <button
            type="button"
            onClick={() => setClearModalOpen(true)}
            disabled={clearPending}
            className="mt-3 w-full max-w-full rounded-full border border-red-600/50 bg-white px-4 py-2.5 text-center text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-60 sm:w-auto sm:px-5"
          >
            Effacer tous les scores et l&apos;historique
          </button>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">Horaire des rounds</h2>
            <p className="mt-1 text-sm text-stk-navy/70">
              Modifiez l&apos;heure de debut et de fin d&apos;un round. Tous les rounds suivants seront decales du meme intervalle.
            </p>
          </div>
          {hasAnyOverride ? (
            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              disabled={reschedulePending}
              className="shrink-0 rounded-full border border-stk-navy/20 px-4 py-2 text-sm font-medium text-stk-navy transition hover:bg-stk-sky/50 disabled:opacity-60"
            >
              Reinitialiser l&apos;horaire officiel
            </button>
          ) : null}
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-stk-navy/10">
          <table className="w-full min-w-lg border-collapse text-sm">
            <thead>
              <tr className="bg-stk-navy/5 text-left text-xs font-semibold uppercase tracking-wide text-stk-navy/60">
                <th className="px-4 py-3">Round</th>
                <th className="px-4 py-3">Horaire actuel</th>
                <th className="px-4 py-3">Horaire officiel</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stk-navy/6">
              {roundTimes.map((round) =>
                editingRound === round.roundIndex ? (
                  <tr key={round.roundIndex} className="bg-stk-sky/20">
                    <td className="px-4 py-3 font-semibold text-stk-navy">
                      #{round.roundIndex + 1}
                    </td>
                    <td colSpan={2} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs font-medium text-stk-navy">
                          Debut
                          <input
                            type="time"
                            value={editStartTime}
                            onChange={(e) => setEditStartTime(e.target.value)}
                            className={inputClass + " w-32"}
                          />
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-stk-navy">
                          Fin
                          <input
                            type="time"
                            value={editEndTime}
                            onChange={(e) => setEditEndTime(e.target.value)}
                            className={inputClass + " w-32"}
                          />
                        </label>
                        <span className="text-xs text-stk-navy/55">
                          Les rounds #{round.roundIndex + 2}–#10 seront decales du meme ecart
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={applyRoundTime}
                          disabled={reschedulePending}
                          className="rounded-full bg-stk-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-stk-accent/90 disabled:opacity-60"
                        >
                          Appliquer
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRound(null)}
                          disabled={reschedulePending}
                          className="rounded-full border border-stk-navy/20 px-3 py-1.5 text-xs font-medium text-stk-navy transition hover:bg-stk-sky/50 disabled:opacity-60"
                        >
                          Annuler
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={round.roundIndex} className="hover:bg-stk-sky/10">
                    <td className="px-4 py-3 font-semibold text-stk-navy">
                      #{round.roundIndex + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className={round.isOverridden ? "font-medium text-stk-accent" : "text-stk-navy"}>
                        {round.effectiveStartLocalTime}–{round.effectiveEndLocalTime}
                      </span>
                      {round.isOverridden ? (
                        <span className="ml-2 inline-flex items-center rounded-full bg-stk-accent/15 px-2 py-0.5 text-xs font-medium text-stk-accent">
                          modifie
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-stk-navy/50">
                      {round.officialLocalTime}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openRoundEditor(round)}
                        className="rounded-full border border-stk-navy/20 px-3 py-1.5 text-xs font-medium text-stk-navy transition hover:bg-stk-sky/50"
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        {rescheduleMessage ? (
          <p
            className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
              rescheduleMessage.type === "success"
                ? "border border-stk-sage/50 bg-stk-sage/35 text-stk-navy"
                : "border border-stk-accent/40 bg-stk-accent/15 text-stk-navy"
            }`}
          >
            {rescheduleMessage.text}
          </p>
        ) : null}
      </section>

      {message ? (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "border border-stk-sage/50 bg-stk-sage/35 text-stk-navy"
              : "border border-stk-accent/40 bg-stk-accent/15 text-stk-navy"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <button
        type="button"
        onClick={logout}
        className="rounded-full border border-stk-navy/20 px-4 py-2 text-sm font-medium text-stk-navy transition hover:bg-stk-sky/50"
      >
        Se deconnecter
      </button>

      {resetConfirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stk-navy/50 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => !reschedulePending && setResetConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-times-dialog-title"
            className="max-w-md rounded-2xl border border-stk-navy/15 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="reset-times-dialog-title"
              className="text-lg font-semibold text-stk-navy"
            >
              Reinitialiser l&apos;horaire ?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-stk-navy/80">
              Cette action remet tous les rounds a leurs heures officielles. Les scores ne sont pas affectes.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                disabled={reschedulePending}
                className="rounded-full border border-stk-navy/20 px-4 py-2 text-sm font-medium text-stk-navy transition hover:bg-stk-sky/50 disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={resetAllTimes}
                disabled={reschedulePending}
                className="rounded-full bg-stk-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-stk-navy/90 disabled:opacity-60"
              >
                {reschedulePending ? "Reinitialisation…" : "Oui, reinitialiser"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {clearModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stk-navy/50 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => !clearPending && setClearModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-scores-dialog-title"
            className="max-w-md rounded-2xl border border-stk-navy/15 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="clear-scores-dialog-title"
              className="text-lg font-semibold text-stk-navy"
            >
              Effacer tous les scores ?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-stk-navy/80">
              Cette action remet tous les matchs sans score et vide
              l&apos;historique des scores enregistre. Elle ne peut pas etre
              annulee.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                disabled={clearPending}
                className="rounded-full border border-stk-navy/20 px-4 py-2 text-sm font-medium text-stk-navy transition hover:bg-stk-sky/50 disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmClearScores}
                disabled={clearPending}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
              >
                {clearPending ? "Suppression…" : "Oui, tout effacer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
