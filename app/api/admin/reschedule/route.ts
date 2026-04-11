import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { resetSectionTimes, updateSectionTime } from "@/lib/tournament";

type RescheduleBody =
  | { reset: true }
  | { roundIndex: number; newStartTime: string; newEndTime?: string };

export async function POST(request: Request) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as RescheduleBody;

  if ("reset" in body && body.reset) {
    await resetSectionTimes();
  } else if ("roundIndex" in body) {
    const { roundIndex, newStartTime, newEndTime } = body;
    if (
      typeof roundIndex !== "number" ||
      typeof newStartTime !== "string" ||
      !/^\d{2}:\d{2}$/.test(newStartTime) ||
      (newEndTime !== undefined && !/^\d{2}:\d{2}$/.test(newEndTime))
    ) {
      return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
    }
    await updateSectionTime(roundIndex, newStartTime, newEndTime);
  } else {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  revalidatePath("/calendar");
  revalidatePath("/admin");
  return NextResponse.json({ ok: true });
}
