"use client";

import { Activity as ActivityIcon, LogIn, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

import { Stagger, StaggerItem } from "@/components/motion";
import { ROLE_TONE } from "@/components/roles";
import { EmptyState, Loading, PageHeader, Section } from "@/components/ui";
import { ago, fetcher, type Activity } from "@/lib/api";

/** "update_plan" → "Update plan"; a few names read better spelled out. */
const NAMES: Record<string, string> = {
  sign_in: "Signed in",
  staff_reply: "Replied to a ticket",
  update_ticket: "Updated a ticket",
  block: "Blocked an account",
  unblock: "Unblocked an account",
  sign_out: "Signed an account out",
  "password_reset.sent": "Sent a password reset",
  "role.change": "Changed a role",
  "credit.adjust": "Adjusted credit",
  "profile.update": "Edited a profile",
  "email.verify": "Confirmed an email",
  "2fa.reset": "Reset two-factor login",
  "countries.update": "Changed blocked countries",
  "account_rules.update": "Changed account rules",
  manual_activate: "Activated an order by hand",
  refund_order: "Refunded an order",
  approve_withdrawal: "Approved a withdrawal",
  reject_withdrawal: "Rejected a withdrawal",
  create_announcement: "Sent an announcement",
};

const actionName = (a: string) => NAMES[a] ?? a.replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function details(d: Record<string, unknown>): string {
  const parts = Object.entries(d)
    .filter(([k]) => !["method", "path", "user_agent"].includes(k))
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
  return parts.join(" · ");
}

export default function ActivityPage() {
  const [days, setDays] = useState(30);
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ days: String(days), page: String(page), ...(actor && { actor }), ...(action && { action }) }).toString();
  const { data } = useSWR<Activity>(`/admin/activity?${qs}`, fetcher, { keepPreviousData: true, refreshInterval: 60000 });
  if (!data) return <Loading />;
  const pages = Math.max(1, Math.ceil(data.total / 50));

  return (
    <>
      <PageHeader
        title="Staff activity"
        description="Every change staff make, recorded when it's saved — plus staff sign-ins."
        actions={
          <div className="flex rounded-xl border border-fg/[0.06] bg-fg/[0.02] p-1 text-sm">
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => (setDays(d), setPage(1))} className={`rounded-lg px-3 py-1.5 ${days === d ? "bg-fg/[0.08] font-semibold text-ink-100" : "text-ink-400 hover:text-ink-100"}`}>
                {d}d
              </button>
            ))}
          </div>
        }
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.staff.map((s) => (
          <StaggerItem key={s.id}>
            <button
              onClick={() => (setActor(actor === s.id ? "" : s.id), setPage(1))}
              className={`card w-full p-5 text-left transition hover:border-brand/30 ${actor === s.id ? "border-brand/50 ring-1 ring-brand/30" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{s.full_name}</p>
                  <p className={`text-xs font-semibold capitalize ${ROLE_TONE[s.role]}`}>{s.role}</p>
                </div>
                {s.two_factor ? <ShieldCheck className="h-4.5 w-4.5 text-ok" aria-label="Two-factor on" /> : <ShieldAlert className="h-4.5 w-4.5 text-amber" aria-label="No two-factor" />}
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <dt className="text-[0.65rem] text-ink-400 uppercase">Actions</dt>
                  <dd className="num text-lg font-bold">{s.actions}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] text-ink-400 uppercase">Replies</dt>
                  <dd className="num text-lg font-bold">{s.replies}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] text-ink-400 uppercase">Last seen</dt>
                  <dd className="mt-1 text-xs text-ink-300">{s.last_login_at ? ago(s.last_login_at) : "never"}</dd>
                </div>
              </dl>
            </button>
          </StaggerItem>
        ))}
      </Stagger>

      <Section
        title={`Log (${data.total})`}
        className="mt-6"
        action={
          <select className="input w-auto text-sm" value={action} onChange={(e) => (setAction(e.target.value), setPage(1))} aria-label="Filter by action">
            <option value="">All actions</option>
            {data.actions.map((a) => (
              <option key={a} value={a}>
                {actionName(a)}
              </option>
            ))}
          </select>
        }
      >
        {data.items.length === 0 ? (
          <EmptyState icon={ActivityIcon} title="Nothing in this period" />
        ) : (
          <ol className="relative space-y-4 border-l border-fg/[0.08] pl-5">
            {data.items.map((i) => (
              <li key={i.id} className="relative text-sm">
                <span className={`absolute top-1 -left-[1.6rem] grid h-4.5 w-4.5 place-items-center rounded-full border-2 border-ink-950 ${i.action === "sign_in" ? "bg-ink-400" : "bg-brand"}`}>
                  {i.action === "sign_in" && <LogIn className="h-2.5 w-2.5 text-ink-950" />}
                </span>
                <p>
                  <b className="text-ink-100">{i.actor ?? "Someone"}</b> <span className="text-ink-300">{actionName(i.action).toLowerCase()}</span>
                  {i.target_type === "user" ? (
                    <>
                      {" "}
                      ·{" "}
                      <Link href={`/admin/users/${i.target_id}`} className="text-brand-light hover:underline">
                        {i.target_label ?? "user"}
                      </Link>
                    </>
                  ) : i.target_type !== "session" && i.target_id !== "-" ? (
                    <span className="num text-xs text-ink-400">
                      {" "}
                      · {i.target_type} {i.target_id.length > 12 ? `${i.target_id.slice(0, 8)}…` : i.target_id}
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-ink-400">
                  {ago(i.created_at)} · {new Date(i.created_at).toLocaleString("en-GB")}
                  {i.action === "sign_in" && ` · from ${i.target_id}`}
                </p>
                {details(i.details) && <p className="num mt-0.5 truncate text-xs text-ink-400">{details(i.details)}</p>}
              </li>
            ))}
          </ol>
        )}
      </Section>
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <button className="btn-ghost px-3 py-1.5" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span className="num text-ink-400">
            {page} / {pages}
          </span>
          <button className="btn-ghost px-3 py-1.5" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </>
  );
}
