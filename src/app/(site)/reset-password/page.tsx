"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { mutate } from "swr";

import { Reveal } from "@/components/motion";
import { ErrorNote, Spinner } from "@/components/ui";
import { MfaStep } from "@/components/AuthForm";
import { isMfa, post, type MfaChallenge, type User } from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <Reset />
    </Suspense>
  );
}

function Reset() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  async function done(user: User) {
    await mutate("/auth/me", user, { revalidate: false });
    router.push("/dashboard");
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("password") !== fd.get("confirm")) {
      setError("The two passwords don't match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await post<User | MfaChallenge>("/auth/reset", { token, password: String(fd.get("password")) });
      if (isMfa(res)) {
        setMfaToken(res.mfa_token); // password saved; two-factor login still asks for a code
        setBusy(false);
      } else await done(res);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Reveal className="mx-auto max-w-md py-20">
      <div className="card p-7 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Choose a new password</h1>
        <p className="mt-1.5 mb-6 text-sm text-ink-300">You&apos;ll be signed in, and other devices will be signed out.</p>
        {mfaToken ? (
          <MfaStep token={mfaToken} onSuccess={done} onCancel={() => router.push("/login")} />
        ) : !token ? (
          <ErrorNote message="This link is incomplete — open the link from your email again." />
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label" htmlFor="password">New password</label>
              <input className="input" id="password" name="password" type="password" required minLength={10} maxLength={128} autoComplete="new-password" />
            </div>
            <div>
              <label className="label" htmlFor="confirm">Repeat it</label>
              <input className="input" id="confirm" name="confirm" type="password" required minLength={10} maxLength={128} autoComplete="new-password" />
            </div>
            <ErrorNote message={error} />
            <button className="btn-primary w-full py-3" disabled={busy}>
              {busy && <Spinner />} Save and sign in
            </button>
          </form>
        )}
      </div>
    </Reveal>
  );
}
