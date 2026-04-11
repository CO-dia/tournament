"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

import { EVENT_TIME_ZONE } from "@/lib/montreal-time";

/** Production host when the QR should not use `localhost` (e.g. local dev). */
const PUBLIC_APP_BASE_DEFAULT = "https://tournament-steel-beta.vercel.app";

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

function absoluteShareUrl(loc: Pick<Location, "pathname" | "search" | "hash" | "hostname" | "origin">): string {
  const path = `${loc.pathname}${loc.search}${loc.hash}`;
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) {
    return `${stripTrailingSlash(env)}${path.startsWith("/") ? path : `/${path}`}`;
  }
  if (loc.hostname === "localhost" || loc.hostname === "127.0.0.1") {
    return `${PUBLIC_APP_BASE_DEFAULT}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return `${loc.origin}${path.startsWith("/") ? path : `/${path}`}`;
}

function formatNow(): string {
  return new Date().toLocaleTimeString("sv-SE", {
    timeZone: EVENT_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function CornerClock() {
  const pathname = usePathname();
  const [time, setTime] = useState<string>(() => formatNow());
  const [pageUrl, setPageUrl] = useState<string | null>(null);

  useEffect(() => {
    setPageUrl(absoluteShareUrl(window.location));
  }, [pathname]);

  useEffect(() => {
    const id = window.setInterval(() => setTime(formatNow()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex select-none flex-col items-center gap-2 rounded-lg border border-stk-navy/10 bg-white/90 p-2 shadow-md shadow-stk-navy/[0.08] backdrop-blur-sm">
      {pageUrl ? (
        <div
          className="rounded-md bg-white p-1 shadow-sm ring-1 ring-stk-navy/[0.06]"
          role="img"
          aria-label={`Code QR ouvrant cette page : ${pageUrl}`}
        >
          <QRCode
            value={pageUrl}
            size={76}
            level="M"
            fgColor="#001f4d"
            bgColor="#ffffff"
          />
        </div>
      ) : null}
      <div
        className="px-1 font-mono text-sm tabular-nums text-stk-navy"
        role="status"
        aria-live="polite"
        aria-label={`Heure locale (${EVENT_TIME_ZONE})`}
      >
        {time}
      </div>
    </div>
  );
}
