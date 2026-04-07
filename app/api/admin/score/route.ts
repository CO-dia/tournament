import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { updateScore } from "@/lib/tournament";

type ScoreBody = {
  matchId?: string;
  homeScore?: number;
  awayScore?: number;
};

export async function POST(request: Request) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ScoreBody;
  if (!body.matchId || body.homeScore === undefined || body.awayScore === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await updateScore(body.matchId, Number(body.homeScore), Number(body.awayScore));
  return NextResponse.json({ ok: true });
}
