"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type QuickScoreMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
};

const inputClass =
  "rounded-xl border border-stk-navy/15 bg-white px-3 py-2 text-sm text-stk-navy outline-none ring-stk-accent/30 transition-shadow focus:ring-2";

export function StandingsQuickScore({ matches }: { matches: QuickScoreMatch[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id ?? "");
  const [homeScore, setHomeScore] = useState("0");
  const [awayScore, setAwayScore] = useState("0");

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId),
    [matches, selectedMatchId],
  );

  useEffect(() => {
    if (!open) return;
    const m = matches.find((x) => x.id === selectedMatchId);
    if (!m) return;
    setHomeScore(m.homeScore !== null && m.homeScore !== undefined ? String(m.homeScore) : "0");
    setAwayScore(m.awayScore !== null && m.awayScore !== undefined ? String(m.awayScore) : "0");
  }, [open, selectedMatchId, matches]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function saveScore() {
    if (!selectedMatchId) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedMatchId,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
        }),
      });
      if (!response.ok) throw new Error("save failed");
      setMessage({ type: "success", text: "Score enregistre." });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Echec de l'enregistrement." });
    } finally {
      setPending(false);
    }
  }

  if (matches.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setMessage(null);
        }}
        className="shrink-0 rounded-full bg-stk-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-stk-accent/90"
      >
        Saisir un score
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="standings-quick-score-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-stk-navy/40 backdrop-blur-[2px]"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-stk-navy/10 bg-white p-5 shadow-xl shadow-stk-navy/15 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 id="standings-quick-score-title" className="text-lg font-semibold text-stk-navy">
                Saisie rapide du score
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-2 py-1 text-sm font-medium text-stk-navy/60 transition hover:bg-stk-sky/40 hover:text-stk-navy"
              >
                Fermer
              </button>
            </div>
            <p className="mt-1 text-sm text-stk-navy/70">Meme action que dans l&apos;admin — sans quitter cette page.</p>

            <div className="mt-5 flex min-w-0 flex-col gap-4">
              <label className="flex min-w-0 flex-col gap-1.5 text-sm">
                <span className="font-medium text-stk-navy">Match</span>
                <select
                  className={`${inputClass} w-full min-w-0`}
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                >
                  {matches.map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.id} — {match.homeTeam} vs {match.awayTeam}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex min-w-0 flex-col gap-1.5 text-sm">
                  <span className="font-medium text-stk-navy">{selectedMatch?.homeTeam ?? "Domicile"}</span>
                  <input
                    type="number"
                    min={0}
                    className={`${inputClass} w-full min-w-0`}
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                  />
                </label>

                <label className="flex min-w-0 flex-col gap-1.5 text-sm">
                  <span className="font-medium text-stk-navy">{selectedMatch?.awayTeam ?? "Exterieur"}</span>
                  <input
                    type="number"
                    min={0}
                    className={`${inputClass} w-full min-w-0`}
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={saveScore}
                disabled={pending || !selectedMatchId}
                className="w-full shrink-0 rounded-full bg-stk-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stk-navy/90 disabled:opacity-60"
              >
                Enregistrer
              </button>
            </div>

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
