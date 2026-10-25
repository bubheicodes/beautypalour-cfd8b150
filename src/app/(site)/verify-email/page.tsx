"use client";

import { CircleCheck, CircleX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { mutate } from "swr";

import { Reveal } from "@/components/motion";
import { Loading } from "@/components/ui";
import { post } from "@/lib/api";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  );
}

function Verify() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"working" | "done" | "failed">(token ? "working" : "failed");
  const [error, setError] = useState("This link is incomplete — open the link from your email again.");
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true; // once, even under React's double effects in development
    post("/auth/verify-email", { token })
      .then(() => {
        setState("done");
        mutate("/auth/me");
      })
      .catch((err: Error) => {
        setError(err.message);
        setState("failed");
      });
  }, [token]);

  return (
    <Reveal className="mx-auto max-w-md py-20">
      <div className="card p-8 text-center">
        {state === "working" ? (
          <Loading />
        ) : state === "done" ? (
          <>
            <CircleCheck className="mx-auto h-12 w-12 text-ok" />
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Email confirmed</h1>
            <p className="mt-2 text-sm text-ink-300">Thanks — your account is all set.</p>
            <Link href="/dashboard" className="btn-primary mt-6 w-full">Go to your dashboard</Link>
          </>
        ) : (
          <>
            <CircleX className="mx-auto h-12 w-12 text-loss" />
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Link not valid</h1>
            <p className="mt-2 text-sm text-ink-300">{error}</p>
            <Link href="/dashboard/account" className="btn-ghost mt-6 w-full">Send a new link</Link>
          </>
        )}
      </div>
    </Reveal>
  );
}
