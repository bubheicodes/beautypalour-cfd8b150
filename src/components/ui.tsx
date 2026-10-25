"use client";

import { Clock, Cog, Hourglass, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { duration, type Queue } from "@/lib/api";

const TONES = {
  green: "border-ok/25 bg-ok/10 text-ok",
  amber: "border-amber/25 bg-amber/10 text-amber",
  red: "border-loss/25 bg-loss/10 text-loss",
  blue: "border-brand/25 bg-brand/10 text-brand-light",
  gray: "border-fg/10 bg-fg/[0.04] text-ink-300",
} as const;

export type Tone = keyof typeof TONES;

export function Chip({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[tone]}`}>
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, [Tone, string]> = {
  pending: ["amber", "Awaiting payment"],
  underpaid: ["amber", "Part paid"],
  paid: ["green", "Paid"],
  failed: ["red", "Failed"],
  refunded: ["gray", "Refunded"],
  queued: ["amber", "In queue"],
  compiling: ["blue", "Compiling"],
  ready: ["green", "Ready"],
  downloaded: ["green", "Downloaded"],
  superseded: ["gray", "Replaced"],
  active: ["green", "Active"],
  expired: ["red", "Expired"],
  cancelled: ["gray", "Cancelled"],
  awaiting_2fa: ["amber", "Needs 2FA code"],
  processing: ["blue", "Sending"],
  rejected: ["red", "Rejected"],
};

export function StatusChip({ status, label }: { status: string; label?: string }) {
  const [tone, text] = STATUS_TONE[status] ?? ["gray", status];
  return (
    <Chip tone={tone}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${tone === "amber" || tone === "blue" ? "animate-pulse" : ""}`} />
      {label ?? text}
    </Chip>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Loading() {
  return (
    <div className="flex justify-center py-24 text-ink-400">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
      {message}
    </p>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.7rem]">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-300">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Section({
  title,
  description,
  action,
  children,
  className = "",
  id,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`card scroll-mt-24 p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-semibold">{title}</h2>}
            {description && <p className="mt-1 text-sm text-ink-300">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const STAT_TONES = {
  blue: "from-brand/20 to-brand/0 text-brand-light",
  green: "from-ok/20 to-ok/0 text-ok",
  amber: "from-amber/20 to-amber/0 text-amber",
  red: "from-loss/20 to-loss/0 text-loss",
} as const;

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "blue",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl ${STAT_TONES[tone]}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-ink-400">{label}</p>
          <p className="num mt-2 truncate text-2xl font-semibold">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-fg/[0.04] ${STAT_TONES[tone].split(" ").pop()}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand-light">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-300">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Seconds left, counting down locally between server refreshes. */
export function useCountdown(seconds: number | null | undefined): number | null {
  const [left, setLeft] = useState<number | null>(seconds ?? null);
  const target = useRef<number | null>(null);
  useEffect(() => {
    target.current = seconds == null ? null : Date.now() + seconds * 1000;
    setLeft(seconds ?? null);
    if (seconds == null) return;
    const t = setInterval(() => {
      if (target.current != null) setLeft(Math.max(0, Math.round((target.current - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, [seconds]);
  return left;
}

/** "You're #3 in the queue · about 2 min 40 s", with a progress bar while compiling. */
export function QueueStatus({ queue, building, compact = false }: { queue: Queue; building?: boolean; compact?: boolean }) {
  const left = useCountdown(queue.eta_seconds);
  const first = useRef(queue.eta_seconds);
  const total = Math.max(first.current ?? 0, queue.eta_seconds ?? 0, 1);
  const progress = left == null ? null : Math.min(100, Math.max(4, ((total - left) / total) * 100));
  const Icon = building ? Cog : queue.ahead > 0 ? Hourglass : Clock;

  const line =
    queue.eta_seconds == null
      ? "Our team is preparing your file — you'll get an email and SMS when it's ready."
      : left === 0
        ? "Almost done…"
        : `About ${duration(left ?? 0)} left`;
  const where = building
    ? "Compiling your personal copy now"
    : queue.ahead === 0
      ? "You're next in the queue"
      : `You're #${queue.position} in the queue · ${queue.ahead} ahead of you`;

  return (
    <div className={`rounded-2xl border border-brand/20 bg-brand/[0.06] ${compact ? "p-3.5" : "p-5"}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand-light">
          <Icon className={`h-4.5 w-4.5 ${building ? "animate-spin [animation-duration:3s]" : ""}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{where}</p>
          <p className="mt-0.5 text-sm text-ink-300">
            {queue.eta_seconds != null && <span className="num text-brand-light">{line}</span>}
            {queue.eta_seconds == null && line}
          </p>
          {progress != null && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-fg/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-deep to-brand-light transition-[width] duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
