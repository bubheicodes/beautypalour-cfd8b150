"use client";

import { Copy, Download, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Chip, ErrorNote, Spinner } from "@/components/ui";
import { del, post, type User } from "@/lib/api";

type Setup = { secret: string; uri: string; qr: string };

/** Turn two-factor login on (QR → confirm code → recovery codes), regenerate codes, or turn it off. */
export function TwoFactorCard({ user, onChange }: { user: User; onChange: () => void }) {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [mode, setMode] = useState<"idle" | "disable" | "regenerate">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const field = (e: FormEvent<HTMLFormElement>, name: string) => String(new FormData(e.currentTarget).get(name) ?? "");

  if (codes) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-300">
          Save these recovery codes somewhere safe (a password manager is ideal). Each one signs you in once if you lose your phone. They won&apos;t be shown again.
        </p>
        <ul className="num grid grid-cols-2 gap-2 rounded-xl border border-fg/[0.08] bg-fg/[0.03] p-4 text-sm">
          {codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(codes.join("\n"))}>
            <Copy className="h-4 w-4" /> Copy
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              const url = URL.createObjectURL(new Blob([`TradePilot recovery codes\n\n${codes.join("\n")}\n`], { type: "text/plain" }));
              Object.assign(document.createElement("a"), { href: url, download: "tradepilot-recovery-codes.txt" }).click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4" /> Download
          </button>
          <button className="btn-primary" onClick={() => (setCodes(null), onChange())}>
            I&apos;ve saved them
          </button>
        </div>
      </div>
    );
  }

  if (setup) {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const code = field(e, "code");
          run(async () => setCodes((await post<{ codes: string[] }>("/me/2fa/enable", { code })).codes)).then(() => setSetup(null));
        }}
      >
        <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-300">
          <li>Scan this QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy…).</li>
          <li>Enter the 6-digit code it shows.</li>
        </ol>
        <div className="flex flex-wrap items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element -- data: URI from our API */}
          <img src={setup.qr} alt="QR code for your authenticator app" className="h-40 w-40 rounded-xl bg-white p-2" />
          <div className="min-w-0 flex-1 text-xs text-ink-400">
            <p>Can&apos;t scan? Enter this key instead:</p>
            <p className="num mt-1 break-all text-sm text-ink-100">{setup.secret.match(/.{1,4}/g)?.join(" ")}</p>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="tf-code">Code from the app</label>
          <input id="tf-code" name="code" className="input num max-w-48 tracking-[0.3em]" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9 ]{6,7}" maxLength={7} autoFocus />
        </div>
        <ErrorNote message={error} />
        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy}>
            {busy ? <Spinner /> : <ShieldCheck className="h-4 w-4" />} Turn on
          </button>
          <button type="button" className="btn-ghost" onClick={() => setSetup(null)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (!user.two_factor) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-300">
          Add a code from an authenticator app to every sign-in, so a stolen password isn&apos;t enough to get into your account.
          {user.two_factor_required && <b className="text-amber"> Required for staff accounts.</b>}
        </p>
        <ErrorNote message={error} />
        <button className="btn-primary" disabled={busy} onClick={() => run(async () => setSetup(await post<Setup>("/me/2fa/setup")))}>
          {busy ? <Spinner /> : <ShieldCheck className="h-4 w-4" />} Set up two-factor login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sm">
        <Chip tone="green">On</Chip> <span className="text-ink-300">Signing in asks for a code from your authenticator app.</span>
      </p>
      {mode === "idle" ? (
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => setMode("regenerate")}>
            New recovery codes
          </button>
          {!user.two_factor_required && (
            <button className="btn-ghost text-loss" onClick={() => setMode("disable")}>
              <ShieldOff className="h-4 w-4" /> Turn off
            </button>
          )}
        </div>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const code = field(e, "code");
            const password = field(e, "password");
            run(async () => {
              if (mode === "regenerate") setCodes((await post<{ codes: string[] }>("/me/2fa/recovery-codes", { code })).codes);
              else {
                await post("/me/2fa/disable", { code, password });
                onChange();
              }
              setMode("idle");
            });
          }}
        >
          {mode === "disable" && (
            <div>
              <label className="label" htmlFor="tf-pw">Your password</label>
              <input id="tf-pw" name="password" type="password" className="input" required autoComplete="current-password" />
            </div>
          )}
          <div>
            <label className="label" htmlFor="tf-code2">Code from the app</label>
            <input id="tf-code2" name="code" className="input num max-w-48 tracking-[0.3em]" inputMode="numeric" autoComplete="one-time-code" required maxLength={16} />
          </div>
          <ErrorNote message={error} />
          <div className="flex gap-2">
            <button className={mode === "disable" ? "btn-danger" : "btn-primary"} disabled={busy}>
              {busy && <Spinner />} {mode === "disable" ? "Turn off two-factor login" : "Make new codes"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setMode("idle")}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/** Download everything we hold, or delete the account. */
export function YourData({ user, onDeleted }: { user: User; onDeleted: () => void }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await del("/me", { password: fd.get("password"), confirm: fd.get("confirm"), code: fd.get("code") || null });
      onDeleted();
      router.push("/");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-ink-300">A JSON file with your profile, orders, subscriptions, tickets, referral rewards and withdrawals.</p>
        <a href="/api/me/export" className="btn-ghost mt-3" download>
          <Download className="h-4 w-4" /> Download my data
        </a>
      </div>
      <div className="h-px bg-fg/[0.06]" />
      {user.role !== "user" ? (
        <p className="text-sm text-ink-400">Staff accounts can&apos;t be deleted. Ask an admin to change your role first.</p>
      ) : !confirming ? (
        <div>
          <p className="text-sm text-ink-300">Deleting your account removes your personal details and stops your EA licences straight away. Unused credit is lost. Payment records are kept for accounting, without your name.</p>
          <button className="btn-danger mt-3" onClick={() => setConfirming(true)}>
            <Trash2 className="h-4 w-4" /> Delete my account
          </button>
        </div>
      ) : (
        <form onSubmit={remove} className="space-y-3 rounded-2xl border border-loss/25 bg-loss/[0.05] p-4">
          <p className="text-sm font-medium text-ink-100">This can&apos;t be undone.</p>
          <div>
            <label className="label" htmlFor="d-pw">Your password</label>
            <input id="d-pw" name="password" type="password" className="input" required autoComplete="current-password" />
          </div>
          {user.two_factor && (
            <div>
              <label className="label" htmlFor="d-code">Code from your authenticator app</label>
              <input id="d-code" name="code" className="input num max-w-48" inputMode="numeric" autoComplete="one-time-code" required maxLength={16} />
            </div>
          )}
          <div>
            <label className="label" htmlFor="d-confirm">
              Type <b className="num text-ink-100">DELETE</b> to confirm
            </label>
            <input id="d-confirm" name="confirm" className="input num max-w-48" required pattern="DELETE" autoComplete="off" />
          </div>
          <ErrorNote message={error} />
          <div className="flex gap-2">
            <button className="btn-danger" disabled={busy}>
              {busy ? <Spinner /> : <Trash2 className="h-4 w-4" />} Delete permanently
            </button>
            <button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
