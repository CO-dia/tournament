import { playoffMatchEndIso } from "@/lib/playoff-schedule";
import {
  buildEffectiveStartToRoundIndex,
  getEffectiveGroupEndIso,
  getResolvedMatches,
  type TournamentState,
} from "@/lib/tournament";

type Resolved = ReturnType<typeof getResolvedMatches>[number];

function matchFullyScored(m: Resolved): boolean {
  return m.homeScore !== null && m.awayScore !== null;
}

function slotEndMs(matchesInSlot: Resolved[], state: TournamentState): number {
  const first = matchesInSlot[0];
  if (!first) return 0;
  const allGroup = matchesInSlot.every((m) => m.phase === "group");
  if (allGroup) {
    const roundMap = buildEffectiveStartToRoundIndex(state);
    const roundIndex = roundMap.get(first.startsAt);
    if (roundIndex !== undefined) {
      return new Date(getEffectiveGroupEndIso(state, roundIndex)).getTime();
    }
    return new Date(first.startsAt).getTime() + 30 * 60 * 1000;
  }
  return Math.max(
    ...matchesInSlot.map((m) => new Date(playoffMatchEndIso(m.id)).getTime()),
  );
}

/**
 * Saison: creneau selon l'horloge Montréal (fenêtre 30 min par round).
 * Phases finales: fenêtres définies dans `playoff-schedule`.
 *
 * On part du creneau actif : `now` est avant la fin de sa fenêtre (sinon on ancre sur le dernier creneau si tout est passé),
 * puis on avance dans le temps tant que tous les matchs du creneau ont déjà un score.
 */
export function getCurrentPlayingMatches(
  state: TournamentState,
  nowMs: number = Date.now(),
): {
  matches: Resolved[];
  startsAt: string | null;
  allComplete: boolean;
} {
  const all = getResolvedMatches(state);
  if (all.length === 0) {
    return { matches: [], startsAt: null, allComplete: true };
  }

  const byStarts = new Map<string, Resolved[]>();
  for (const m of all) {
    const list = byStarts.get(m.startsAt);
    if (list) list.push(m);
    else byStarts.set(m.startsAt, [m]);
  }
  for (const list of byStarts.values()) {
    list.sort((a, b) => a.court - b.court);
  }

  const slots = [...byStarts.entries()]
    .map(([startsAt, matches]) => ({
      startsAt,
      matches,
      startMs: new Date(startsAt).getTime(),
      endMs: slotEndMs(matches, state),
    }))
    .sort((a, b) => a.startMs - b.startMs);

  const anchorIdx = (() => {
    const idx = slots.findIndex((s) => nowMs < s.endMs);
    if (idx === -1) return slots.length - 1;
    return idx;
  })();

  for (let j = anchorIdx; j < slots.length; j++) {
    const slot = slots[j]!;
    if (!slot.matches.every(matchFullyScored)) {
      return {
        matches: slot.matches,
        startsAt: slot.startsAt,
        allComplete: false,
      };
    }
  }

  const entireComplete = slots.every((s) => s.matches.every(matchFullyScored));
  return { matches: [], startsAt: null, allComplete: entireComplete };
}
