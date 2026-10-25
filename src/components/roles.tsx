"use client";

import { useState } from "react";

import { Spinner } from "@/components/ui";
import { put, type Role } from "@/lib/api";

export const ROLE_OPTIONS: { role: Role; label: string; blurb: string }[] = [
  { role: "user", label: "Customer", blurb: "Buys and manages their own EA licences." },
  { role: "support", label: "Support", blurb: "Answers tickets, fixes accounts and writes help articles. No money or licence changes." },
  { role: "management", label: "Management", blurb: "Sees everything, including analytics and finance, but can't change anything." },
  { role: "admin", label: "Admin", blurb: "Full access, including prices, payouts, licences, roles and settings." },
];

export const ROLE_TONE = { admin: "text-loss", management: "text-amber", support: "text-brand-light", user: "text-ink-300" } as const;

/** Inline role selector for admins. Asks before changing, since it signs the person out. */
export function RolePicker({ user, onChanged }: { user: { id: string; full_name: string; role: Role }; onChanged: (role: Role) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(role: Role) {
    if (role === user.role) return;
    const label = ROLE_OPTIONS.find((o) => o.role === role)?.label;
    if (!window.confirm(`Make ${user.full_name} ${label}? They'll be signed out and get the new access when they sign in again.`)) return;
    setBusy(true);
    setError(null);
    try {
      await put(`/admin/users/${user.id}/role`, { role });
      onChanged(role);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col">
      <span className="inline-flex items-center gap-2">
        <select
          className={`input w-auto py-1 pr-8 pl-2 text-xs font-semibold ${ROLE_TONE[user.role]}`}
          value={user.role}
          disabled={busy}
          onChange={(e) => change(e.target.value as Role)}
          aria-label={`Role for ${user.full_name}`}
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.role} value={o.role}>
              {o.label}
            </option>
          ))}
        </select>
        {busy && <Spinner className="h-3.5 w-3.5" />}
      </span>
      {error && <span className="mt-1 max-w-48 text-[0.7rem] text-loss">{error}</span>}
    </span>
  );
}
