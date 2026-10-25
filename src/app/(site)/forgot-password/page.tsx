"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Reveal } from "@/components/motion";
import { ErrorNote, Spinner } from "@/components/ui";
import { post } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await post("/auth/forgot", { email: String(new FormData(e.currentTarget).get("email")) });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Reveal className="mx-auto max-w-md py-20">
      <div className="card p-7 sm:p-8">
        {sent ? (
          <div className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ok/15 text-ok">
              <MailCheck className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-xl font-bold">Check your email</h1>
            <p className="mt-2 text-sm text-ink-300">
              If an account uses that address, a reset link is on its way. It works once and expires in 30 minutes.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
            <p className="mt-1.5 mb-6 text-sm text-ink-300">Enter your account email and we&apos;ll send you a reset link.</p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input className="input" id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <ErrorNote message={error} />
              <button className="btn-primary w-full py-3" disabled={busy}>
                {busy && <Spinner />} Send reset link
              </button>
            </form>
          </>
        )}
      </div>
      <p className="mt-5 text-center text-sm text-ink-400">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-brand-light hover:underline">
          Sign in
        </Link>
      </p>
    </Reveal>
  );
}
