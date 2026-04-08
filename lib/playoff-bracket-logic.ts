export type BracketMatch = {
  id: string;
  homeSlot: number;
  awaySlot: number;
  homeScore: number | null;
  awayScore: number | null;
};

export function matchWinnerSlot(m: BracketMatch): number | null {
  if (m.homeScore === null || m.awayScore === null) return null;
  if (m.homeScore === m.awayScore) return null;
  return m.homeScore > m.awayScore ? m.homeSlot : m.awaySlot;
}

export function matchLoserSlot(m: BracketMatch): number | null {
  const w = matchWinnerSlot(m);
  if (w === null) return null;
  return m.homeSlot === w ? m.awaySlot : m.homeSlot;
}

export function slotInQfMatch(slot: number, m: BracketMatch | undefined): boolean {
  return !!m && (m.homeSlot === slot || m.awaySlot === slot);
}

export function qfEliminated(slot: number, m: BracketMatch | undefined): boolean {
  if (!m || m.homeScore === null || m.awayScore === null) return false;
  const w = matchWinnerSlot(m);
  return w !== null && w !== slot;
}

export function isEliminatedFromPlayoffs(slot: number, bracket: BracketMatch[]): boolean {
  for (const id of ["QF1", "QF2", "QF3", "QF4"] as const) {
    const m = bracket.find((x) => x.id === id);
    if (m && slotInQfMatch(slot, m) && qfEliminated(slot, m)) return true;
  }
  for (const id of ["SF1", "SF2"] as const) {
    const m = bracket.find((x) => x.id === id);
    if (!m || !slotInQfMatch(slot, m)) continue;
    if (m.homeScore === null || m.awayScore === null) continue;
    const w = matchWinnerSlot(m);
    if (w !== null && w !== slot) return true;
  }
  const f = bracket.find((x) => x.id === "F1");
  if (f && slotInQfMatch(slot, f) && f.homeScore !== null && f.awayScore !== null) {
    const w = matchWinnerSlot(f);
    if (w !== null && w !== slot) return true;
  }
  return false;
}

export function isInPlayoffQuarter(slot: number, bracket: BracketMatch[]): boolean {
  return ["QF1", "QF2", "QF3", "QF4"].some((id) => {
    const m = bracket.find((x) => x.id === id);
    return m && slotInQfMatch(slot, m);
  });
}

export function shouldShowSf1(slot: number, bracket: BracketMatch[]): boolean {
  const q1 = bracket.find((m) => m.id === "QF1");
  const q2 = bracket.find((m) => m.id === "QF2");
  const sf1 = bracket.find((m) => m.id === "SF1");
  if (sf1 && slotInQfMatch(slot, sf1) && (sf1.homeScore === null || sf1.awayScore === null)) return true;
  if (q1 && slotInQfMatch(slot, q1) && !qfEliminated(slot, q1)) return true;
  if (q2 && slotInQfMatch(slot, q2) && !qfEliminated(slot, q2)) return true;
  return false;
}

export function shouldShowSf2(slot: number, bracket: BracketMatch[]): boolean {
  const q3 = bracket.find((m) => m.id === "QF3");
  const q4 = bracket.find((m) => m.id === "QF4");
  const sf2 = bracket.find((m) => m.id === "SF2");
  if (sf2 && slotInQfMatch(slot, sf2) && (sf2.homeScore === null || sf2.awayScore === null)) return true;
  if (q3 && slotInQfMatch(slot, q3) && !qfEliminated(slot, q3)) return true;
  if (q4 && slotInQfMatch(slot, q4) && !qfEliminated(slot, q4)) return true;
  return false;
}

export function shouldShowFinal(slot: number, bracket: BracketMatch[]): boolean {
  if (isEliminatedFromPlayoffs(slot, bracket)) return false;
  if (!isInPlayoffQuarter(slot, bracket)) return false;
  const f = bracket.find((m) => m.id === "F1");
  if (f && slotInQfMatch(slot, f) && (f.homeScore === null || f.awayScore === null)) return true;
  const fUnplayed = !f || f.homeScore === null || f.awayScore === null;
  return fUnplayed;
}

export function shouldShowThirdPlace(slot: number, bracket: BracketMatch[]): boolean {
  const tp1 = bracket.find((m) => m.id === "TP1");
  if (
    tp1 &&
    slotInQfMatch(slot, tp1) &&
    (tp1.homeScore === null || tp1.awayScore === null)
  ) {
    return true;
  }

  const sf1 = bracket.find((m) => m.id === "SF1");
  const sf2 = bracket.find((m) => m.id === "SF2");
  const w1 = sf1 ? matchWinnerSlot(sf1) : null;
  const w2 = sf2 ? matchWinnerSlot(sf2) : null;

  if (sf1 && sf1.homeScore !== null && sf1.awayScore !== null && w1 !== null) {
    if (matchLoserSlot(sf1) === slot) return true;
  }
  if (sf2 && sf2.homeScore !== null && sf2.awayScore !== null && w2 !== null) {
    if (matchLoserSlot(sf2) === slot) return true;
  }

  if (w1 === slot || w2 === slot) return false;

  return shouldShowSf1(slot, bracket) || shouldShowSf2(slot, bracket);
}

/** Synthetic rows use homeSlot/awaySlot < 1 so they are not mistaken for real team slots. */
export function teamSeesPlayoffResolvedRow(
  slot: number,
  row: { id: string; phase: string; homeSlot: number; awaySlot: number },
  bracket: BracketMatch[],
): boolean {
  if (row.phase === "group") return false;
  if (row.homeSlot === slot || row.awaySlot === slot) return true;
  if (row.homeSlot >= 1 && row.awaySlot >= 1) return false;
  if (row.id === "SF1") return shouldShowSf1(slot, bracket);
  if (row.id === "SF2") return shouldShowSf2(slot, bracket);
  if (row.id === "TP1") return shouldShowThirdPlace(slot, bracket);
  if (row.id === "F1") return shouldShowFinal(slot, bracket);
  return false;
}
