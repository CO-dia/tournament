import { NextResponse } from "next/server";
import { getResolvedMatches, getStandings, getState } from "@/lib/tournament";

export async function GET() {
  const state = await getState();
  return NextResponse.json({
    slots: state.slots,
    matches: getResolvedMatches(state),
    standings: getStandings(state),
    scoreHistory: state.scoreHistory ?? [],
  });
}
