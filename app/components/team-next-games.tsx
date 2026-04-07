"use client";

import { useState } from "react";

import { terrainPillClasses } from "@/lib/terrain-styles";

type TeamOption = {
  slot: number;
  assignedName: string | null;
};

type ResolvedMatch = {
  id: string;
  startsAt: string;
  court: number;
  homeSlot: number;
  awaySlot: number;
  homeTeam: string;
  awayTeam: string;
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

export function TeamNextGames({ slots, matches }: { slots: TeamOption[]; matches: ResolvedMatch[] }) {
  const [selectedSlot, setSelectedSlot] = useState(slots[0]?.slot ?? 1);

  const teamMatches = matches
    .filter(
      (match) => match.homeSlot === selectedSlot || match.awaySlot === selectedSlot,
    )
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .filter((match) => match.homeScore === null || match.awayScore === null)
    .slice(0, 6);

  return (
    <section className="space-y-4 rounded-2xl border border-stk-navy/10 bg-white/80 p-5 shadow-md shadow-stk-navy/[0.05] backdrop-blur-sm">
      <div className="flex flex-col gap-1 border-b border-stk-navy/10 pb-3">
        <h2 className="text-xl font-semibold">Prochains matchs par equipe</h2>
        <p className="text-sm text-stk-navy/65">Choisissez une equipe pour voir ses prochains matchs.</p>
      </div>
      <label className="flex max-w-md flex-col gap-2 text-sm">
        <span className="font-medium text-stk-navy">Equipe</span>
        <select
          className="rounded-xl border border-stk-navy/15 bg-white px-3 py-2 text-stk-navy shadow-inner outline-none ring-stk-accent/30 transition-shadow focus:ring-2"
          value={selectedSlot}
          onChange={(event) => setSelectedSlot(Number(event.target.value))}
        >
          {slots.map((slot) => (
            <option key={slot.slot} value={slot.slot}>
              {slot.assignedName?.trim()
                ? `${slot.assignedName.trim()} (${slot.slot})`
                : `(${slot.slot})`}
            </option>
          ))}
        </select>
      </label>

      {teamMatches.length === 0 ? (
        <p className="rounded-xl bg-stk-sage/25 px-4 py-3 text-sm text-stk-navy/75">Aucun match a venir pour cette equipe.</p>
      ) : (
        <ul className="space-y-2">
          {teamMatches.map((match) => (
            <li
              key={match.id}
              className="rounded-xl border border-stk-navy/8 bg-gradient-to-r from-stk-sky/35 to-white px-4 py-3 text-sm text-stk-navy"
            >
              <span className="font-semibold text-stk-navy">{formatDateTime(match.startsAt)}</span>
              <span className="text-stk-navy/45"> · </span>
              <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${terrainPillClasses(match.court)}`}>
                Terrain {match.court}
              </span>
              <span className="text-stk-navy/45"> · </span>
              {match.homeTeam} vs {match.awayTeam}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
