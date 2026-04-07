"use client";

import { useState } from "react";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      setError("Mot de passe invalide.");
      setPending(false);
      return;
    }

    window.location.reload();
  }

  return (
    <form
      className="space-y-4 rounded-2xl border border-stk-navy/10 bg-white/90 p-6 shadow-md shadow-stk-navy/[0.06] backdrop-blur-sm"
      onSubmit={onSubmit}
    >
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-stk-navy">Mot de passe</span>
        <input
          type="password"
          className="rounded-xl border border-stk-navy/15 bg-white px-3 py-2 text-stk-navy outline-none ring-stk-accent/30 transition-shadow focus:ring-2"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-stk-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stk-navy/90 disabled:opacity-60 sm:w-auto"
      >
        Se connecter
      </button>
      {error ? (
        <p className="text-sm font-medium text-stk-accent">{error}</p>
      ) : null}
    </form>
  );
}
