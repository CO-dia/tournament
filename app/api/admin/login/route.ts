import { NextResponse } from "next/server";
import { getAdminPassword, setAdminCookie } from "@/lib/auth";

type LoginBody = {
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;
  if (body.password !== getAdminPassword()) {
    return NextResponse.json({ error: "Mot de passe invalide" }, { status: 401 });
  }

  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
