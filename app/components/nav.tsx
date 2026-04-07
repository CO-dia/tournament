"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/calendar", label: "Calendrier" },
  { href: "/standings", label: "Classement" },
  { href: "/admin", label: "Admin" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-stk-navy/10 bg-white/85 shadow-sm shadow-stk-navy/5 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-3 outline-none transition-opacity hover:opacity-90"
        >
          <Image
            src="/logo.png"
            alt="Sampana Tanora Kristiana — FJKM Canada Montréal"
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 object-contain drop-shadow-sm"
            priority
          />
          <div className="min-w-0 text-left">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-stk-accent">
              FJKM Canada Montréal
            </p>
            <p className="font-serif text-lg font-semibold leading-tight text-stk-navy group-hover:text-stk-navy/90">
              Tournoi de volley-ball
            </p>
            <p className="mt-0.5 text-xs italic text-stk-navy/55">
              « Que personne ne meprise ta jeunesse... » — 1 Tim. 4:12
            </p>
          </div>
        </Link>

        <nav
          className="flex flex-wrap gap-1.5 sm:justify-end"
          aria-label="Navigation principale"
        >
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-stk-navy text-white shadow-sm"
                    : "text-stk-navy/80 hover:bg-stk-sky/60 hover:text-stk-navy"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
