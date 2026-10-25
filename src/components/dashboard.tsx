"use client";

import { ArrowUpRight, Download, MonitorSmartphone, Pencil, Plus, RefreshCw, Rocket } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import useSWR from "swr";

import { Chip, EmptyState, ErrorNote, QueueStatus, Spinner, StatusChip } from "@/components/ui";
import {
  ago,
  api,
  daysLeft,
  fetcher,
  put,
  shortDate,
  usd,
  type Account,
  type Build,
  type Dashboard,
  type DownloadLinkOut,
  type Order,
  type Plan,
  type Subscription,
} from "@/lib/api";

/** Build states the customer just sees as "being prepared". */
export const PREPARING = new Set(["queued", "compiling", "failed"]);

export function useDashboard() {
  return useSWR<Dashboard>("/me/dashboard", fetcher, {
    // Poll while a file is being prepared, so the wait time and "ready" update by themselves.
    refreshInterval: (d) => (d?.builds.some((b) => PREPARING.has(b.status)) ? 5000 : 0),
  });
}

// ---- EA file ----

export function BuildCard({ build, onChange }: { build: Build; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preparing = PREPARING.has(build.status);
  const downloadable = build.status === "ready" || build.status === "downloaded";

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const link = await api<DownloadLinkOut>(`/me/builds/${build.id}/download`);
      if (!link.url.startsWith("/api/files/")) throw new Error("Unexpected download link");
      window.location.assign(link.url);
      setTimeout(onChange, 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand/25 to-brand/5 text-brand-light">
            <Rocket className="h-5 w-5" />
          </span>
          <div>
            <p className="num font-semibold break-all">TradePilot_{build.order_code}.ex5</p>
            <p className="mt-0.5 text-xs text-ink-400">
              {preparing
                ? `Requested ${ago(build.created_at)}${build.reason === "rebuild" ? " · updated file" : ""}`
                : `Delivered ${shortDate(build.uploaded_at ?? build.created_at)} · licence checked online`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusChip status={preparing ? (build.status === "compiling" ? "compiling" : "queued") : build.status} />
          {downloadable && (
            <button className="btn-primary" onClick={download} disabled={busy}>
              {busy ? <Spinner /> : <Download className="h-4 w-4" />} Download
            </button>
          )}
        </div>
      </div>
      {preparing && build.queue && (
        <div className="mt-5">
          <QueueStatus queue={build.queue} building={build.status === "compiling"} />
        </div>
      )}
      {downloadable && <Mt5Setup />}
      <div className="mt-3">
        <ErrorNote message={error} />
      </div>
    </div>
  );
}

function Mt5Setup() {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return (
    <ol className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
      {[
        ["Allow the licence server", <>Tools → Options → Expert Advisors → tick <i>Allow WebRequest for listed URL</i> and add <span className="num text-ink-100">{origin}</span></>],
        ["Install the file", <>File → Open Data Folder → MQL5 → Experts, paste the .ex5, then refresh the Navigator.</>],
        ["Attach to a chart", <>Drag TradePilot onto your chart and enable Algo Trading. The panel shows <b>Licence: ACTIVE</b>.</>],
      ].map(([title, body], i) => (
        <li key={i} className="rounded-xl border border-fg/[0.06] bg-fg/[0.02] p-4">
          <span className="num text-xs font-semibold text-brand-light">Step {i + 1}</span>
          <p className="mt-1 font-medium">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-400">{body}</p>
        </li>
      ))}
    </ol>
  );
}

// ---- subscription ----

export function SubscriptionCard({ sub, plans }: { sub: Subscription; plans: Plan[] }) {
  const left = daysLeft(sub.expires_at);
  const live = sub.status === "active" && left > 0;
  const lifetime = sub.plan.lifetime;
  const total = sub.plan.days || 30;
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  const upgrades = plans.filter((p) => p.days > sub.plan.days);
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">{sub.plan.name}</h3>
            <StatusChip status={live ? "active" : "expired"} />
          </div>
          <p className="mt-1 text-sm text-ink-300">
            {lifetime ? (
              <b className="text-ink-100">Lifetime access — never expires</b>
            ) : (
              <>
                Licensed until <b className="text-ink-100">{shortDate(sub.expires_at)}</b>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!lifetime && (
            <Link href={`/checkout?plan=${sub.plan.code}&renew=${sub.id}`} className="btn-primary">
              <RefreshCw className="h-4 w-4" /> Renew
            </Link>
          )}
          {live && upgrades.length > 0 && (
            <Link href={`/checkout?plan=${upgrades[0].code}&upgrade=${sub.id}`} className="btn-ghost">
              <ArrowUpRight className="h-4 w-4" /> Upgrade
            </Link>
          )}
        </div>
      </div>
      <div className="mt-5">
        <div className="flex justify-between text-xs text-ink-400">
          <span>{lifetime ? "Lifetime" : live ? `${left} day${left === 1 ? "" : "s"} left` : "Expired — renew to keep trading"}</span>
          <span className="num">
            {sub.accounts.length} account{sub.accounts.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-fg/[0.06]">
          <div
            className={`h-full rounded-full ${left <= 7 ? "bg-gradient-to-r from-amber to-amber/70" : "bg-gradient-to-r from-brand-deep to-brand-light"}`}
            style={{ width: `${lifetime ? 100 : live ? pct : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ---- accounts ----

const RUNNING_LABEL: Record<string, string> = {
  ok: "licensed",
  expired: "licence expired",
  wrong_account: "account not licensed — check login & server",
  revoked: "old file — download the latest",
};

export function AccountsCard({ sub, onChange }: { sub: Subscription; onChange: () => void }) {
  const live = sub.status === "active" && daysLeft(sub.expires_at) > 0;
  const freeLive = sub.plan.live_slots - sub.accounts.filter((a) => a.type === "live").length;
  const freeDemo = sub.plan.demo_slots - sub.accounts.filter((a) => a.type === "demo").length;
  const freeTypes = [...(freeLive > 0 ? ["live"] : []), ...(freeDemo > 0 ? ["demo"] : [])] as ("live" | "demo")[];
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">MT5 accounts · {sub.plan.name}</h3>
          <p className="mt-0.5 text-xs text-ink-400">Changes reach your running EA within 30 minutes — no new file needed.</p>
        </div>
        <span className="num rounded-full bg-fg/[0.04] px-2.5 py-1 text-xs text-ink-300">
          swaps {sub.swaps_used}/{sub.swaps_allowed}
        </span>
      </div>
      <ul className="divide-y divide-fg/[0.05] overflow-hidden rounded-xl border border-fg/[0.06]">
        {sub.accounts.map((acc) => (
          <AccountRow key={acc.id} sub={sub} acc={acc} canEdit={live} onChange={onChange} />
        ))}
        {live && freeTypes.length > 0 && <AccountRow sub={sub} canEdit onChange={onChange} freeTypes={freeTypes} />}
      </ul>
      {sub.running.length > 0 && (
        <>
          <p className="mt-6 mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-300 uppercase">
            <MonitorSmartphone className="h-3.5 w-3.5" /> Seen running
          </p>
          <ul className="space-y-2">
            {sub.running.slice(0, 6).map((r) => (
              <li key={`${r.mt5_login}-${r.last_seen}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-fg/[0.02] px-4 py-2.5 text-sm">
                <span className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${r.status === "ok" ? "bg-ok" : "bg-amber"}`} />
                  <span className="num">{r.mt5_login}</span>
                  <span className="text-ink-400">{r.broker_server}</span>
                </span>
                <span className="flex items-center gap-3 text-xs">
                  <span className={r.status === "ok" ? "text-ok" : "text-amber"}>{RUNNING_LABEL[r.status]}</span>
                  <span className="text-ink-400">{ago(r.last_seen)}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function AccountRow({
  sub,
  acc,
  canEdit,
  onChange,
  freeTypes,
}: {
  sub: Subscription;
  acc?: Account;
  canEdit: boolean;
  onChange: () => void;
  freeTypes?: ("live" | "demo")[];
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await put("/me/accounts", {
        subscription_id: sub.id,
        account_id: acc?.id,
        account: { mt5_login: Number(fd.get("login")), broker_server: String(fd.get("server")).trim(), type: acc?.type ?? fd.get("type") },
      });
      setEditing(false);
      onChange();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
        {acc ? (
          <>
            <span className="flex flex-wrap items-center gap-3">
              <Chip tone={acc.type === "live" ? "green" : "blue"}>{acc.type}</Chip>
              <span className="num font-medium">{acc.mt5_login}</span>
              <span className="text-ink-400">{acc.broker_server}</span>
            </span>
            {canEdit && sub.swaps_used < sub.swaps_allowed && (
              <button className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-brand-light" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" /> Change
              </button>
            )}
          </>
        ) : (
          <button className="flex items-center gap-1.5 text-sm font-medium text-brand-light hover:underline" onClick={() => setEditing(true)}>
            <Plus className="h-4 w-4" /> Add an account (free slot)
          </button>
        )}
      </li>
    );
  }

  return (
    <li className="bg-fg/[0.02] px-4 py-3">
      <form onSubmit={save} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {!acc && freeTypes && (
          <select name="type" className="input sm:w-28" defaultValue={freeTypes[0]}>
            {freeTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
        <input name="login" className="input num" placeholder="MT5 login" defaultValue={acc?.mt5_login} required pattern="\d{3,12}" inputMode="numeric" />
        <input name="server" className="input" placeholder="Broker server" defaultValue={acc?.broker_server} required maxLength={64} />
        <div className="flex gap-2">
          <button className="btn-primary px-3" disabled={busy}>
            {busy ? <Spinner /> : "Save"}
          </button>
          <button type="button" className="btn-ghost px-3" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
      <div className="mt-2">
        <ErrorNote message={error} />
      </div>
    </li>
  );
}

// ---- orders ----

export function OrdersTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <EmptyState icon={Rocket} title="No orders yet" body="Your purchases and renewals will show here." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-ink-400">
          <tr className="border-b border-fg/[0.06]">
            <th className="px-4 py-3 font-medium">Order</th>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-fg/[0.04]">
          {orders.map((o) => (
            <tr key={o.id} className="transition hover:bg-fg/[0.02]">
              <td className="num px-4 py-3">
                <Link href={`/orders/${o.id}`} className="text-brand-light hover:underline">
                  {o.code}
                </Link>
              </td>
              <td className="px-4 py-3">
                {o.plan.name} {o.kind !== "new" && <span className="text-ink-400">· {o.kind}</span>}
              </td>
              <td className="num px-4 py-3">{usd(o.amount)}</td>
              <td className="px-4 py-3">
                <StatusChip status={o.status} />
              </td>
              <td className="px-4 py-3 text-ink-400">{shortDate(o.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
