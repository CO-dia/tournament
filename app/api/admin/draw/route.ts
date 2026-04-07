import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { updateDraw } from "@/lib/tournament";

type DrawBody = {
  assignments?: Record<number, string | null>;
};

export async function POST(request: Request) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as DrawBody;
  if (!body.assignments) {
    return NextResponse.json({ error: "Missing assignments" }, { status: 400 });
  }

  await updateDraw(body.assignments);
  return NextResponse.json({ ok: true });
}
