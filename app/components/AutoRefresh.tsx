"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const INTERVAL_MS = 120_000;

function formatTime(date: Date): string {
  return date.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function AutoRefresh() {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function refresh() {
    setSpinning(true);
    router.refresh();
    setLastUpdated(new Date());
    setTimeout(() => setSpinning(false), 700);
  }

  useEffect(() => {
    timerRef.current = setInterval(refresh, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-50 flex select-none items-center gap-2 rounded-lg border border-stk-navy/10 bg-white/90 px-3 py-1.5 shadow-md shadow-stk-navy/8 backdrop-blur-sm">
      <button
        onClick={refresh}
        title="Actualiser maintenant"
        className="text-stk-navy/50 transition hover:text-stk-navy active:scale-90"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`h-3.5 w-3.5 transition-transform duration-700 ${spinning ? "animate-spin" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>
      <span className="font-mono text-xs tabular-nums text-stk-navy/55">
        Mis à jour à {formatTime(lastUpdated)}
      </span>
    </div>
  );
}
