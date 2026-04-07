import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { clearAllScores } from "@/lib/tournament";

export async function POST() {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await clearAllScores();
  return NextResponse.json({ ok: true });
}
