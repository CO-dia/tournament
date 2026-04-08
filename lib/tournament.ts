import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import teamsFile from "@/data/teams.json";

import type { PlayoffAfficheRow } from "./playoff-affiche-shared";
import { matchWinnerSlot } from "./playoff-bracket-logic";
import { playoffCourt, playoffMatchStartIso } from "./playoff-schedule";

export type { PlayoffAfficheRow } from "./playoff-affiche-shared";
export { isPlayoffScoreRowEditable } from "./playoff-affiche-shared";

export type TeamSlot = {
  slot: number;
  assignedName: string | null;
};

export type Match = {
  id: string;
  phase: "group" | "quarter" | "semi" | "final";
  startsAt: string;
  court: 1 | 2 | 3 | 4;
  homeSlot: number;
  awaySlot: number;
  refereeSlot?: number;
  homeScore: number | null;
  awayScore: number | null;
};

export type ScoreHistoryEntry = {
  /** ISO timestamp (when the score was saved, or match time for imported rows) */
  recordedAt: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
};

export type TournamentState = {
  slots: TeamSlot[];
  matches: Match[];
  scoreHistory?: ScoreHistoryEntry[];
};

type TeamsFile = { teams: { slot: number; name: string }[] };

/** Official pool of team names (from `data/teams.json`) — for admin UI only; slots stay unassigned until drawn. */
export function getOfficialTeamNames(): string[] {
  return (teamsFile as TeamsFile).teams
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.name.trim());
}

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "tournament.json");

export type OfficialSeasonRow = {
  time: string;
  court1: [number, number] | null;
  referee1: number | null;
  court2: [number, number] | null;
  referee2: number | null;
  court3: [number, number] | null;
  referee3: number | null;
  rest: number[];
};

export const officialSeasonRows: OfficialSeasonRow[] = [
  {
    time: "10:15",
    court1: [1, 9],
    referee1: 4,
    court2: [2, 8],
    referee2: 5,
    court3: [3, 7],
    referee3: 6,
    rest: [],
  },
  {
    time: "10:45",
    court1: [4, 6],
    referee1: 1,
    court2: [2, 5],
    referee2: 3,
    court3: [8, 9],
    referee3: 7,
    rest: [],
  },
  {
    time: "11:15",
    court1: [1, 8],
    referee1: 4,
    court2: [2, 7],
    referee2: 5,
    court3: [3, 6],
    referee3: 9,
    rest: [],
  },
  {
    time: "11:45",
    court1: [4, 5],
    referee1: 1,
    court2: [3, 9],
    referee2: 2,
    court3: [7, 8],
    referee3: 6,
    rest: [],
  },
  {
    time: "12:15",
    court1: [1, 7],
    referee1: 4,
    court2: [2, 6],
    referee2: 8,
    court3: [3, 5],
    referee3: 9,
    rest: [],
  },
  {
    time: "12:45",
    court1: [2, 4],
    referee1: 1,
    court2: [5, 8],
    referee2: 3,
    court3: [6, 7],
    referee3: 9,
    rest: [],
  },
  {
    time: "13:15",
    court1: [1, 6],
    referee1: 2,
    court2: null,
    referee2: null,
    court3: [3, 4],
    referee3: 5,
    rest: [7, 8, 9],
  },
  {
    time: "13:45",
    court1: [1, 5],
    referee1: 7,
    court2: [4, 9],
    referee2: 8,
    court3: null,
    referee3: null,
    rest: [6, 2, 3],
  },
  {
    time: "14:15",
    court1: [7, 9],
    referee1: 6,
    court2: [8, 3],
    referee2: 2,
    court3: null,
    referee3: null,
    rest: [4, 5, 1],
  },
  {
    time: "14:45",
    court1: [5, 6],
    referee1: 3,
    court2: [2, 9],
    referee2: 7,
    court3: [4, 1],
    referee3: 8,
    rest: [],
  },
];

/**
 * Wall clock in Montréal on 2026-04-11 (EDT, UTC−4). Matches the calendrier "Horaire" column; safe on Vercel (UTC).
 */
export function timeToStartsAtIso(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const utcMs = Date.UTC(2026, 3, 11, hours + 4, minutes, 0, 0);
  return new Date(utcMs).toISOString();
}

function buildOfficialMatches(): Match[] {
  const matches: Match[] = [];
  let index = 1;

  for (const row of officialSeasonRows) {
    const startsAt = timeToStartsAtIso(row.time);
    const entries: Array<[1 | 2 | 3, [number, number] | null, number | null]> =
      [
        [1, row.court1, row.referee1],
        [2, row.court2, row.referee2],
        [3, row.court3, row.referee3],
      ];

    for (const [court, pairing, refereeSlot] of entries) {
      if (!pairing) continue;
      matches.push({
        id: `S${index}`,
        phase: "group",
        startsAt,
        court,
        homeSlot: pairing[0],
        awaySlot: pairing[1],
        refereeSlot: refereeSlot ?? undefined,
        homeScore: null,
        awayScore: null,
      });
      index += 1;
    }
  }

  return matches;
}

function getGroupMatches(matches: Match[]) {
  return matches.filter((match) => match.phase === "group");
}

function hasOfficialSchedule(matches: Match[]) {
  const group = getGroupMatches(matches);
  const official = buildOfficialMatches();
  if (group.length !== official.length) return false;
  return group.every((match, index) => {
    const expected = official[index];
    return (
      match.id === expected.id &&
      match.startsAt === expected.startsAt &&
      match.court === expected.court &&
      match.homeSlot === expected.homeSlot &&
      match.awaySlot === expected.awaySlot &&
      match.refereeSlot === expected.refereeSlot
    );
  });
}

const defaultState: TournamentState = {
  slots: Array.from({ length: 9 }, (_, index) => ({
    slot: index + 1,
    assignedName: null,
  })),
  matches: buildOfficialMatches(),
  scoreHistory: [],
};

async function ensureDataFile() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify(defaultState, null, 2), "utf8");
  }
}

/** Upstash Redis (e.g. Vercel Storage) — avoids EROFS on serverless where /var/task is read-only. */
const REDIS_STATE_KEY = "tournament:state";

/**
 * `Redis.fromEnv()` only reads `UPSTASH_REDIS_*`. Vercel’s dashboard often exposes `KV_REST_API_*`
 * instead — same REST API; use read/write `KV_REST_API_TOKEN`, not read-only.
 */
function getRedisRestConfig(): { url: string; token: string } | null {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    return { url: upstashUrl, token: upstashToken };
  }
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (kvUrl && kvToken) {
    return { url: kvUrl, token: kvToken };
  }
  return null;
}

function assertWritableStateBackend(): void {
  if (process.env.VERCEL && !getRedisRestConfig()) {
    throw new Error(
      "Missing Redis REST credentials. In Vercel: link Storage → Redis, or set KV_REST_API_URL and KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN), then redeploy.",
    );
  }
}

/**
 * Upstash may return either a string or a parsed object for JSON payloads.
 * `JSON.parse(object)` stringifies to `"[object Object]"` and throws — normalize first.
 */
function redisStateValueToJsonString(v: unknown): string {
  if (typeof v === "string") {
    return v;
  }
  if (v !== null && typeof v === "object") {
    return JSON.stringify(v);
  }
  throw new Error("Invalid tournament state in Redis");
}

async function readStateString(): Promise<string> {
  const rest = getRedisRestConfig();
  if (rest) {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url: rest.url, token: rest.token });
    const v = await redis.get(REDIS_STATE_KEY);
    if (v === null || v === undefined) {
      const initial = JSON.stringify(defaultState, null, 2);
      await redis.set(REDIS_STATE_KEY, initial);
      return initial;
    }
    return redisStateValueToJsonString(v);
  }
  assertWritableStateBackend();
  await ensureDataFile();
  return readFile(dataFile, "utf8");
}

async function writeStateString(json: string): Promise<void> {
  const rest = getRedisRestConfig();
  if (rest) {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url: rest.url, token: rest.token });
    await redis.set(REDIS_STATE_KEY, json);
    return;
  }
  assertWritableStateBackend();
  await ensureDataFile();
  await writeFile(dataFile, json, "utf8");
}

function backfillScoreHistory(matches: Match[]): ScoreHistoryEntry[] {
  return matches
    .filter((match) => match.homeScore !== null && match.awayScore !== null)
    .map((match) => ({
      recordedAt: match.startsAt,
      matchId: match.id,
      homeScore: match.homeScore!,
      awayScore: match.awayScore!,
    }))
    .sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    );
}

export async function getState(): Promise<TournamentState> {
  const raw = await readStateString();
  let parsed = JSON.parse(raw) as TournamentState;

  if (!hasOfficialSchedule(parsed.matches)) {
    const priorHistory =
      parsed.scoreHistory && parsed.scoreHistory.length > 0
        ? parsed.scoreHistory
        : backfillScoreHistory(parsed.matches);
    const byId = new Map(parsed.matches.map((m) => [m.id, m]));
    const merged = buildOfficialMatches().map((om) => {
      const old = byId.get(om.id);
      if (!old) return om;
      return {
        ...om,
        homeScore: old.homeScore,
        awayScore: old.awayScore,
      };
    });
    const preservedPlayoff = parsed.matches.filter((m) => m.phase !== "group");
    const migrated: TournamentState = {
      ...parsed,
      matches: [...merged, ...preservedPlayoff],
      scoreHistory: priorHistory,
    };
    const synced = syncPlayoffMatchesToState(migrated);
    await writeStateString(JSON.stringify(synced, null, 2));
    return synced;
  }

  if (parsed.scoreHistory === undefined || parsed.scoreHistory === null) {
    parsed = {
      ...parsed,
      scoreHistory: backfillScoreHistory(parsed.matches),
    };
    await writeStateString(JSON.stringify(parsed, null, 2));
  }

  const synced = syncPlayoffMatchesToState(parsed);
  if (synced !== parsed) {
    await writeStateString(JSON.stringify(synced, null, 2));
    return synced;
  }

  return parsed;
}

async function setState(next: TournamentState) {
  await writeStateString(JSON.stringify(next, null, 2));
}

export async function updateDraw(assignments: Record<number, string | null>) {
  const state = await getState();
  const slots = state.slots.map((slot) => {
    const nextValue = assignments[slot.slot];
    if (nextValue === undefined) return slot;

    const cleaned = nextValue?.trim() || null;
    return {
      ...slot,
      assignedName: cleaned,
    };
  });

  await setState({ ...state, slots });
}

export async function updateScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
) {
  const state = await getState();
  const entry: ScoreHistoryEntry = {
    recordedAt: new Date().toISOString(),
    matchId,
    homeScore,
    awayScore,
  };
  const matches = state.matches.map((match) =>
    match.id === matchId ? { ...match, homeScore, awayScore } : match,
  );
  const scoreHistory = [...(state.scoreHistory ?? []), entry];
  await setState({ ...state, matches, scoreHistory });
}

/** Remove all match scores and the score history log (admin only). */
export async function clearAllScores() {
  const state = await getState();
  const matches = state.matches.map((match) => ({
    ...match,
    homeScore: null,
    awayScore: null,
  }));
  await setState({ ...state, matches, scoreHistory: [] });
}

export function getTeamName(slots: TeamSlot[], slotNumber: number) {
  const assignedName =
    slots.find((slot) => slot.slot === slotNumber)?.assignedName?.trim() ?? "";
  const slotLabel = `(${slotNumber})`;
  return assignedName ? `${assignedName} ${slotLabel}` : slotLabel;
}

export type StandingsRow = {
  slot: number;
  team: string;
  played: number;
  won: number;
  lost: number;
  /** Somme des points marqués dans chaque match (total rally, pas des points de classement 3/1/0) */
  scoreFor: number;
  scoreAgainst: number;
};

export function getStandings(state: TournamentState): StandingsRow[] {
  const names = state.slots.map((slot) => ({
    slot: slot.slot,
    team: getTeamName(state.slots, slot.slot),
    played: 0,
    won: 0,
    lost: 0,
    scoreFor: 0,
    scoreAgainst: 0,
  }));

  for (const match of state.matches) {
    if (match.phase !== "group") continue;
    if (match.homeScore === null || match.awayScore === null) continue;

    const homeScore = Number(match.homeScore);
    const awayScore = Number(match.awayScore);
    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) continue;

    const home = names.find((entry) => entry.slot === match.homeSlot);
    const away = names.find((entry) => entry.slot === match.awaySlot);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.scoreFor += homeScore;
    home.scoreAgainst += awayScore;
    away.scoreFor += awayScore;
    away.scoreAgainst += homeScore;

    if (homeScore > awayScore) {
      home.won += 1;
      away.lost += 1;
    } else if (awayScore > homeScore) {
      away.won += 1;
      home.lost += 1;
    }
  }

  return [...names].sort((a, b) => {
    if (b.scoreFor !== a.scoreFor) return b.scoreFor - a.scoreFor;
    const diffA = a.scoreFor - a.scoreAgainst;
    const diffB = b.scoreFor - b.scoreAgainst;
    if (diffB !== diffA) return diffB - diffA;
    return b.won - a.won;
  });
}

/** Indices into the top-8 classement for each quarter-final (same pairing as the official bracket). */
const PLAYOFF_QF_PAIR_INDICES: [number, number][] = [
  [0, 7],
  [3, 4],
  [1, 6],
  [2, 5],
];

/** 1-based ranks shown when a classement row is missing. */
const PLAYOFF_QF_RANK_LABELS: [number, number][] = [
  [1, 8],
  [4, 5],
  [2, 7],
  [3, 6],
];

function orderSlotsByStandings(
  standings: StandingsRow[],
  slotA: number,
  slotB: number,
): [number, number] {
  const ia = standings.findIndex((r) => r.slot === slotA);
  const ib = standings.findIndex((r) => r.slot === slotB);
  if (ia === -1) return [slotB, slotA];
  if (ib === -1) return [slotA, slotB];
  return ia <= ib ? [slotA, slotB] : [slotB, slotA];
}

/**
 * Ensures QF/SF/F match rows exist with slots aligned to the bracket, preserving scores.
 * Playoff matches must not affect the saison classement — see `getStandings`.
 */
function syncPlayoffMatchesToState(state: TournamentState): TournamentState {
  const groupMatches = getGroupMatches(state.matches);
  const playoffById = new Map(
    state.matches.filter((m) => m.phase !== "group").map((m) => [m.id, m]),
  );
  const standings = getStandings(state);
  const top8 = standings.slice(0, 8);

  const qfBuilt: Match[] = [];
  for (let qi = 0; qi < 4; qi++) {
    const [i, j] = PLAYOFF_QF_PAIR_INDICES[qi]!;
    const rowA = top8[i];
    const rowB = top8[j];
    const old = playoffById.get(`QF${qi + 1}`);
    let homeSlot = rowA?.slot ?? 1;
    let awaySlot = rowB?.slot ?? 2;
    if (old && (old.homeScore !== null || old.awayScore !== null)) {
      homeSlot = old.homeSlot;
      awaySlot = old.awaySlot;
    }
    const qid = `QF${qi + 1}` as const;
    qfBuilt.push({
      id: qid,
      phase: "quarter",
      startsAt: playoffMatchStartIso(qid),
      court: playoffCourt(qid),
      homeSlot,
      awaySlot,
      refereeSlot: old?.refereeSlot,
      homeScore: old?.homeScore ?? null,
      awayScore: old?.awayScore ?? null,
    });
  }

  const qfById = new Map(qfBuilt.map((m) => [m.id, m]));
  const sfBuilt: Match[] = [];

  for (let si = 0; si < 2; si++) {
    const qfa = qfById.get(`QF${si * 2 + 1}`);
    const qfb = qfById.get(`QF${si * 2 + 2}`);
    const w1 = qfa ? matchWinnerSlot(qfa) : null;
    const w2 = qfb ? matchWinnerSlot(qfb) : null;
    const old = playoffById.get(`SF${si + 1}`);

    if (w1 !== null && w2 !== null) {
      const [hs, as] = orderSlotsByStandings(standings, w1, w2);
      let homeSlot = hs;
      let awaySlot = as;
      if (old && (old.homeScore !== null || old.awayScore !== null)) {
        homeSlot = old.homeSlot;
        awaySlot = old.awaySlot;
      }
      const sid = `SF${si + 1}` as const;
      sfBuilt.push({
        id: sid,
        phase: "semi",
        startsAt: playoffMatchStartIso(sid),
        court: playoffCourt(sid),
        homeSlot,
        awaySlot,
        refereeSlot: old?.refereeSlot,
        homeScore: old?.homeScore ?? null,
        awayScore: old?.awayScore ?? null,
      });
    } else if (old && old.homeScore !== null && old.awayScore !== null) {
      sfBuilt.push({ ...old, court: playoffCourt(old.id) });
    }
  }

  const sfById = new Map(sfBuilt.map((m) => [m.id, m]));
  const sf1 = sfById.get("SF1");
  const sf2 = sfById.get("SF2");
  const sf1w = sf1 ? matchWinnerSlot(sf1) : null;
  const sf2w = sf2 ? matchWinnerSlot(sf2) : null;
  const oldFinal = playoffById.get("F1");
  let finalBuilt: Match | null = null;

  if (sf1w !== null && sf2w !== null) {
    const [hs, as] = orderSlotsByStandings(standings, sf1w, sf2w);
    let homeSlot = hs;
    let awaySlot = as;
    if (oldFinal && (oldFinal.homeScore !== null || oldFinal.awayScore !== null)) {
      homeSlot = oldFinal.homeSlot;
      awaySlot = oldFinal.awaySlot;
    }
    finalBuilt = {
      id: "F1",
      phase: "final",
      startsAt: playoffMatchStartIso("F1"),
      court: playoffCourt("F1"),
      homeSlot,
      awaySlot,
      refereeSlot: oldFinal?.refereeSlot,
      homeScore: oldFinal?.homeScore ?? null,
      awayScore: oldFinal?.awayScore ?? null,
    };
  } else if (oldFinal && oldFinal.homeScore !== null && oldFinal.awayScore !== null) {
    finalBuilt = { ...oldFinal, court: playoffCourt("F1") };
  }

  const playoffNext = [...qfBuilt, ...sfBuilt, ...(finalBuilt ? [finalBuilt] : [])];
  const nextMatches = [...groupMatches, ...playoffNext];
  if (JSON.stringify(state.matches) === JSON.stringify(nextMatches)) {
    return state;
  }
  return { ...state, matches: nextMatches };
}

function alignMatchScores(
  m: Match | undefined,
  displayHomeSlot: number,
  displayAwaySlot: number,
): { homeScore: number | null; awayScore: number | null } {
  if (!m || m.homeScore === null || m.awayScore === null) {
    return { homeScore: null, awayScore: null };
  }
  if (m.homeSlot === displayHomeSlot && m.awaySlot === displayAwaySlot) {
    return { homeScore: m.homeScore, awayScore: m.awayScore };
  }
  if (m.homeSlot === displayAwaySlot && m.awaySlot === displayHomeSlot) {
    return { homeScore: m.awayScore, awayScore: m.homeScore };
  }
  return { homeScore: m.homeScore, awayScore: m.awayScore };
}

function teamNameForSlot(
  standings: StandingsRow[],
  slots: TeamSlot[],
  slot: number,
) {
  return (
    standings.find((r) => r.slot === slot)?.team ?? getTeamName(slots, slot)
  );
}

/**
 * Playoff affiches: quarts follow the live classement (top 8). Demi-finales and finale stay
 * placeholders until the previous round has recorded winners (or that round’s match is fully scored).
 */
export function getPlayoffAfficheRows(
  state: TournamentState,
): PlayoffAfficheRow[] {
  const standings = getStandings(state);
  const top8 = standings.slice(0, 8);
  const byId = new Map(state.matches.map((m) => [m.id, m]));

  const rows: PlayoffAfficheRow[] = [];

  for (let qi = 0; qi < 4; qi++) {
    const [i, j] = PLAYOFF_QF_PAIR_INDICES[qi]!;
    const [ra, rb] = PLAYOFF_QF_RANK_LABELS[qi]!;
    const rowA = top8[i];
    const rowB = top8[j];
    const homeTeam = rowA?.team ?? `Rang (${ra})`;
    const awayTeam = rowB?.team ?? `Rang (${rb})`;
    const slotA = rowA?.slot ?? -1;
    const slotB = rowB?.slot ?? -1;
    const m = byId.get(`QF${qi + 1}`);
    let homeScore: number | null = null;
    let awayScore: number | null = null;
    if (slotA > 0 && slotB > 0) {
      const aligned = alignMatchScores(m, slotA, slotB);
      homeScore = aligned.homeScore;
      awayScore = aligned.awayScore;
    }

    rows.push({
      matchId: `QF${qi + 1}`,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      refereeTeam: m?.refereeSlot
        ? getTeamName(state.slots, m.refereeSlot)
        : null,
    });
  }

  const sfPlaceholders: [string, string][] = [
    ["Vainqueur QF1", "Vainqueur QF2"],
    ["Vainqueur QF3", "Vainqueur QF4"],
  ];

  for (let si = 0; si < 2; si++) {
    const m = byId.get(`SF${si + 1}`);
    const qfa = byId.get(`QF${si * 2 + 1}`);
    const qfb = byId.get(`QF${si * 2 + 2}`);
    const w1 = qfa ? matchWinnerSlot(qfa) : null;
    const w2 = qfb ? matchWinnerSlot(qfb) : null;
    const [phHome, phAway] = sfPlaceholders[si]!;

    if (
      m &&
      m.homeScore !== null &&
      m.awayScore !== null &&
      matchWinnerSlot(m) !== null
    ) {
      rows.push({
        matchId: `SF${si + 1}`,
        homeTeam: teamNameForSlot(standings, state.slots, m.homeSlot),
        awayTeam: teamNameForSlot(standings, state.slots, m.awaySlot),
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        refereeTeam: m.refereeSlot
          ? getTeamName(state.slots, m.refereeSlot)
          : null,
      });
    } else if (w1 !== null && w2 !== null) {
      const [homeSlot, awaySlot] = orderSlotsByStandings(standings, w1, w2);
      const aligned = alignMatchScores(m, homeSlot, awaySlot);
      rows.push({
        matchId: `SF${si + 1}`,
        homeTeam: teamNameForSlot(standings, state.slots, homeSlot),
        awayTeam: teamNameForSlot(standings, state.slots, awaySlot),
        homeScore: aligned.homeScore,
        awayScore: aligned.awayScore,
        refereeTeam: m?.refereeSlot
          ? getTeamName(state.slots, m.refereeSlot)
          : null,
      });
    } else {
      rows.push({
        matchId: `SF${si + 1}`,
        homeTeam: phHome,
        awayTeam: phAway,
        homeScore: null,
        awayScore: null,
        refereeTeam: m?.refereeSlot
          ? getTeamName(state.slots, m.refereeSlot)
          : null,
      });
    }
  }

  const mFinal = byId.get("F1");
  const sf1 = byId.get("SF1");
  const sf2 = byId.get("SF2");
  const sf1w = sf1 ? matchWinnerSlot(sf1) : null;
  const sf2w = sf2 ? matchWinnerSlot(sf2) : null;

  if (
    mFinal &&
    mFinal.homeScore !== null &&
    mFinal.awayScore !== null &&
    matchWinnerSlot(mFinal) !== null
  ) {
    rows.push({
      matchId: "F1",
      homeTeam: teamNameForSlot(standings, state.slots, mFinal.homeSlot),
      awayTeam: teamNameForSlot(standings, state.slots, mFinal.awaySlot),
      homeScore: mFinal.homeScore,
      awayScore: mFinal.awayScore,
      refereeTeam: mFinal.refereeSlot
        ? getTeamName(state.slots, mFinal.refereeSlot)
        : null,
    });
  } else if (sf1w !== null && sf2w !== null) {
    const [homeSlot, awaySlot] = orderSlotsByStandings(standings, sf1w, sf2w);
    const aligned = alignMatchScores(mFinal, homeSlot, awaySlot);
    rows.push({
      matchId: "F1",
      homeTeam: teamNameForSlot(standings, state.slots, homeSlot),
      awayTeam: teamNameForSlot(standings, state.slots, awaySlot),
      homeScore: aligned.homeScore,
      awayScore: aligned.awayScore,
      refereeTeam: mFinal?.refereeSlot
        ? getTeamName(state.slots, mFinal.refereeSlot)
        : null,
    });
  } else {
    rows.push({
      matchId: "F1",
      homeTeam: "Vainqueur SF1",
      awayTeam: "Vainqueur SF2",
      homeScore: null,
      awayScore: null,
      refereeTeam: mFinal?.refereeSlot
        ? getTeamName(state.slots, mFinal.refereeSlot)
        : null,
    });
  }

  return rows;
}

export function getResolvedMatches(state: TournamentState) {
  const fromState = state.matches.map((match) => ({
    ...match,
    homeTeam: getTeamName(state.slots, match.homeSlot),
    awayTeam: getTeamName(state.slots, match.awaySlot),
    refereeTeam: match.refereeSlot ? getTeamName(state.slots, match.refereeSlot) : null,
  }));

  const byId = new Map(fromState.map((m) => [m.id, m]));
  const afficheById = new Map(getPlayoffAfficheRows(state).map((r) => [r.matchId, r]));

  const extras: typeof fromState = [];
  for (const id of ["SF1", "SF2", "F1"] as const) {
    if (byId.has(id)) continue;
    const row = afficheById.get(id);
    if (!row) continue;
    extras.push({
      id,
      phase: id === "F1" ? "final" : "semi",
      startsAt: playoffMatchStartIso(id),
      court: playoffCourt(id),
      homeSlot: -1,
      awaySlot: -1,
      refereeSlot: undefined,
      homeScore: row.homeScore,
      awayScore: row.awayScore,
      homeTeam: row.homeTeam,
      awayTeam: row.awayTeam,
      refereeTeam: row.refereeTeam,
    });
  }

  return [...fromState, ...extras].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() || a.court - b.court,
  );
}
