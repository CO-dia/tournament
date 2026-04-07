"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { QuickScoreMatch } from "@/app/components/standings-quick-score";

const inputClass =
  "rounded-xl border border-stk-navy/15 bg-white px-3 py-2 text-sm text-stk-navy outline-none ring-stk-accent/30 transition-shadow focus:ring-2";

export function CalendarMatchCell({
  isAdmin,
  match,
}: {
  isAdmin: boolean;
  match: QuickScoreMatch | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [homeScore, setHomeScore] = useState("0");
  const [awayScore, setAwayScore] = useState("0");

  useEffect(() => {
    if (!open || !match) return;
    setHomeScore(match.homeScore !== null && match.homeScore !== undefined ? String(match.homeScore) : "0");
    setAwayScore(match.awayScore !== null && match.awayScore !== undefined ? String(match.awayScore) : "0");
    setMessage(null);
  }, [open, match]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function saveScore() {
    if (!match) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
        }),
      });
      if (!response.ok) throw new Error("save failed");
      setOpen(false);
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Echec de l'enregistrement." });
    } finally {
      setPending(false);
    }
  }

  if (!match) {
    return <span className="text-stk-navy/45">—</span>;
  }

  const scored =
    match.homeScore !== null &&
    match.awayScore !== null &&
    Number.isFinite(match.homeScore) &&
    Number.isFinite(match.awayScore);

  return (
    <>
      <div className="flex min-h-[4.5rem] flex-col justify-center gap-2">
        <p className="text-[0.95rem] font-medium leading-snug text-stk-navy">
          {match.homeTeam} <span className="font-normal text-stk-navy/45">vs</span> {match.awayTeam}
        </p>
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
          {scored ? (
            <p className="inline-flex items-baseline gap-2.5 tabular-nums text-lg font-bold tracking-tight text-stk-navy sm:text-xl">
              <span>{match.homeScore}</span>
              <span className="text-base font-normal text-stk-navy/35">–</span>
              <span>{match.awayScore}</span>
            </p>
          ) : (
            <p className="text-xs font-medium uppercase tracking-wide text-stk-navy/45">A venir</p>
          )}
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="shrink-0 rounded-full border border-stk-navy/20 bg-white/90 px-2.5 py-1 text-xs font-semibold text-stk-navy shadow-sm transition hover:border-stk-accent/40 hover:bg-stk-sky/30"
            >
              Score
            </button>
          ) : null}
        </div>
      </div>

      {open && isAdmin ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-score-dialog-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-stk-navy/40 backdrop-blur-[2px]"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-stk-navy/10 bg-white p-5 shadow-xl shadow-stk-navy/15 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 id="calendar-score-dialog-title" className="text-lg font-semibold text-stk-navy">
                Modifier le score
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-2 py-1 text-sm font-medium text-stk-navy/60 transition hover:bg-stk-sky/40 hover:text-stk-navy"
              >
                Fermer
              </button>
            </div>
            <p className="mt-2 text-sm text-stk-navy/80">
              <span className="font-mono text-xs text-stk-navy/45">{match.id}</span>
              <span className="mx-1.5 text-stk-navy/30">·</span>
              {match.homeTeam} vs {match.awayTeam}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:items-end">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-stk-navy">{match.homeTeam}</span>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-stk-navy">{match.awayTeam}</span>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                />
              </label>
            </div>

            <button
              type="button"
              onClick={saveScore}
              disabled={pending}
              className="mt-5 w-full rounded-full bg-stk-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stk-accent/90 disabled:opacity-60 sm:w-auto"
            >
              Enregistrer
            </button>

            {message ? (
              <p
                className={`mt-4 rounded-xl px-3 py-2 text-sm font-medium ${
                  message.type === "success"
                    ? "border border-stk-sage/50 bg-stk-sage/35 text-stk-navy"
                    : "border border-stk-accent/40 bg-stk-accent/15 text-stk-navy"
                }`}
              >
                {message.text}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
