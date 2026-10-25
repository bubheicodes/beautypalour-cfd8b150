"use client";

import { Gift, KeyRound, RefreshCcw, ShieldCheck, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { mutate } from "swr";

import { LogoMark } from "@/components/Logo";
import { Reveal } from "@/components/motion";
import { isMfa, post, type MfaChallenge, type User } from "@/lib/api";
import { countryOptions } from "@/lib/countries";
import { safeNext } from "@/lib/nav";
import { ErrorNote, Spinner } from "./ui";

type Mode = "login" | "register";

/** The sign-in / sign-up fields. Used on the auth pages and inline at checkout. */
export function AuthFields({
  mode,
  onModeChange,
  onSuccess,
  referral,
}: {
  mode: Mode;
  onModeChange?: (m: Mode) => void;
  onSuccess: (user: User) => void;
  referral?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const countries = useMemo(() => countryOptions(), []);

  async function signedIn(user: User) {
    await mutate("/auth/me", user, { revalidate: false });
    if (mode === "register") clearReferral();
    onSuccess(user);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (!form.country) delete form.country;
    try {
      const res = await post<User | MfaChallenge>(mode === "login" ? "/auth/login" : "/auth/register", form);
      if (isMfa(res)) {
        setMfaToken(res.mfa_token);
        setBusy(false);
        return;
      }
      await signedIn(res);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (mfaToken) {
    return <MfaStep token={mfaToken} onSuccess={signedIn} onCancel={() => setMfaToken(null)} />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {onModeChange && (
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-fg/[0.04] p-1 text-sm font-medium">
          {(["register", "login"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className={`rounded-lg py-2 transition ${mode === m ? "bg-ink-900 text-ink-100 shadow" : "text-ink-400 hover:text-ink-100"}`}
            >
              {m === "register" ? "Create account" : "Sign in"}
            </button>
          ))}
        </div>
      )}
      {mode === "register" && referral && (
        <p className="flex items-center gap-2 rounded-xl border border-brand/25 bg-brand/10 px-3 py-2.5 text-sm text-brand-light">
          <Gift className="h-4 w-4 shrink-0" />
          <span>
            Invited by a TradePilot member <span className="num">({referral})</span>
          </span>
          <input type="hidden" name="referral_code" value={referral} />
        </p>
      )}
      {mode === "register" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="first_name">First name</label>
            <input className="input" id="first_name" name="first_name" required maxLength={60} autoComplete="given-name" />
          </div>
          <div>
            <label className="label" htmlFor="last_name">Last name</label>
            <input className="input" id="last_name" name="last_name" required maxLength={60} autoComplete="family-name" />
          </div>
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      {mode === "register" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="phone">Phone number</label>
            <input className="input num" id="phone" name="phone" type="tel" required placeholder="0712 345 678" autoComplete="tel" />
          </div>
          <div>
            <label className="label" htmlFor="country">Country</label>
            <select className="input" id="country" name="country" required defaultValue="">
              <option value="" disabled>
                Choose…
              </option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between">
          <label className="label" htmlFor="password">Password</label>
          {mode === "login" && (
            <Link href="/forgot-password" className="mb-1.5 text-xs text-brand-light hover:underline">
              Forgot password?
            </Link>
          )}
        </div>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 10 : 1}
          maxLength={128}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        {mode === "register" && <p className="mt-1.5 text-xs text-ink-400">At least 10 characters.</p>}
      </div>
      <ErrorNote message={error} />
      <button className="btn-primary w-full py-3" disabled={busy}>
        {busy && <Spinner />}
        {mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}

/** Second sign-in step: a code from the authenticator app, or a recovery code. */
export function MfaStep({ token, onSuccess, onCancel }: { token: string; onSuccess: (user: User) => void; onCancel: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    try {
      onSuccess(await post<User>("/auth/login/2fa", { mfa_token: token, code }));
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-brand/25 bg-brand/10 p-3 text-sm text-ink-200">
        <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand-light" />
        <p>{recovery ? "Enter one of the recovery codes you saved when you turned on two-factor login." : "Enter the 6-digit code from your authenticator app."}</p>
      </div>
      <div>
        <label className="label" htmlFor="code">{recovery ? "Recovery code" : "Authentication code"}</label>
        <input
          key={String(recovery)}
          className="input num text-center text-lg tracking-[0.4em]"
          id="code"
          name="code"
          required
          autoFocus
          autoComplete="one-time-code"
          inputMode={recovery ? "text" : "numeric"}
          pattern={recovery ? undefined : "[0-9 ]{6,7}"}
          maxLength={recovery ? 16 : 7}
          placeholder={recovery ? "abcd-efgh" : "123456"}
        />
      </div>
      <ErrorNote message={error} />
      <button className="btn-primary w-full py-3" disabled={busy}>
        {busy && <Spinner />}
        Verify and sign in
      </button>
      <div className="flex justify-between text-xs">
        <button type="button" className="text-brand-light hover:underline" onClick={() => setRecovery((v) => !v)}>
          {recovery ? "Use the authenticator app" : "Use a recovery code"}
        </button>
        <button type="button" className="text-ink-400 hover:text-ink-100" onClick={onCancel}>
          Start again
        </button>
      </div>
    </form>
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const referral = useReferralCode(params.get("ref"));
  const other = mode === "login" ? "/register" : "/login";

  return (
    <div className="grid min-h-[calc(100vh-4rem)] items-center gap-12 py-12 lg:grid-cols-2">
      <aside className="hidden lg:block">
        <Reveal>
          <LogoMark className="h-10 w-auto" />
          <h2 className="mt-8 text-4xl leading-tight font-extrabold tracking-tight">
            {mode === "login" ? "Welcome back," : "Start trading"}
            <br />
            <span className="text-brand-gradient">{mode === "login" ? "pilot." : "with precision."}</span>
          </h2>
        </Reveal>
        <ul className="mt-8 space-y-4 text-ink-300">
          {[
            [Zap, "Your personal EA, compiled in minutes"],
            [KeyRound, "Licensed to your own MT5 accounts"],
            [RefreshCcw, "Renewals apply without reinstalling"],
            [Users, "Earn USDT by referring traders"],
          ].map(([Icon, text], i) => {
            const I = Icon as typeof Zap;
            return (
              <Reveal key={text as string} delay={0.1 + i * 0.08}>
                <li className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand-light">
                    <I className="h-4.5 w-4.5" />
                  </span>
                  {text as string}
                </li>
              </Reveal>
            );
          })}
        </ul>
      </aside>

      <Reveal className="mx-auto w-full max-w-md">
        <div className="card p-7 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{mode === "login" ? "Sign in" : "Create your account"}</h1>
          <p className="mt-1.5 mb-7 text-sm text-ink-300">
            {mode === "login" ? "Manage your EA, renewals and referrals." : "Takes a minute. Your phone is used for renewal SMS."}
          </p>
          <AuthFields
            mode={mode}
            referral={referral}
            onSuccess={() => {
              router.push(next);
              router.refresh();
            }}
          />
        </div>
        <p className="mt-5 text-center text-sm text-ink-400">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <Link href={`${other}?next=${encodeURIComponent(next)}`} className="font-medium text-brand-light hover:underline">
            {mode === "login" ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </Reveal>
    </div>
  );
}

const REF_KEY = "tp_ref";

function clearReferral() {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {
    // nothing remembered
  }
}

/** The referral code from ?ref=…, remembered in the browser until the visitor signs up. */
export function useReferralCode(fromUrl: string | null): string | null {
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => {
    const clean = (v: string | null) => (v && /^[A-Za-z0-9]{4,16}$/.test(v) ? v.toUpperCase() : null);
    let value = clean(fromUrl);
    try {
      if (value) localStorage.setItem(REF_KEY, value);
      else value = clean(localStorage.getItem(REF_KEY));
    } catch {
      // storage unavailable (private mode): the URL code still works
    }
    setCode(value);
  }, [fromUrl]);
  return code;
}
