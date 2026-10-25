"use client";

// Admin panels; each one is a page in the admin sidebar (src/app/(app)/admin/*).

import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CircleAlert,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import useSWR from "swr";

import { PlanCard } from "@/components/PlanCard";
import { useCan } from "@/lib/hooks";
import { Chip, EmptyState, ErrorNote, Loading, Section, Spinner, StatCard, StatusChip } from "@/components/ui";
import {
  ago,
  api,
  fetcher,
  post,
  put,
  shortDate,
  usd,
  type AdminBuild,
  type AdminOrder,
  type AdminPlan,
  type AdminReferrals,
  type AdminWithdrawal,
  type PaymentSettings,
  type Plan,
  type RiskFinding,
  type WebhookEvent,
} from "@/lib/api";

// ---- build queue ----

export function BuildQueue() {
  const { data, mutate } = useSWR<AdminBuild[]>("/admin/builds?status=queued", fetcher, { refreshInterval: 10000 });
  if (!data) return <Spinner />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-300">
          {data.length} build{data.length === 1 ? "" : "s"} in progress. The compiler picks these up automatically; a
          build that fails three times waits here for you.
        </p>
        <a href="/api/admin/builds/export.csv?status=queued" className="btn-ghost shrink-0">
          Export CSV
        </a>
      </div>
      {data.length === 0 && <p className="card p-8 text-center text-ink-400">Nothing waiting.</p>}
      {data.map((b) => (
        <QueueItem key={b.id} build={b} onDone={() => mutate()} />
      ))}
    </div>
  );
}

function QueueItem({ build, onDone }: { build: AdminBuild; onDone: () => void }) {
  const licensing = useCan("licensing");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copy() {
    await navigator.clipboard.writeText(build.license_data);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".ex5")) {
      setError("Choose the compiled .ex5 file");
      return;
    }
    await run(() => api(`/admin/builds/${build.id}/upload`, { method: "POST", body: fd }));
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2">
            <span className="num font-semibold">{build.order_code}</span>
            <Chip tone="gray">{build.plan_code}</Chip>
            <Chip tone="amber">{build.reason}</Chip>
            <StatusChip status={build.status} />
          </p>
          <p className="mt-1 text-sm text-ink-300">
            {build.customer_name} · {build.customer_email} · <span className="num">{build.customer_phone}</span>
          </p>
          <p className="mt-1 text-xs text-ink-400">
            {build.accounts.map((a) => `${a.mt5_login} (${a.type}, ${a.broker_server})`).join(" · ")}
          </p>
        </div>
        <p className="num text-right text-xs text-ink-400">
          queued {shortDate(build.created_at)}
          {build.compile_attempts > 0 && <span className="block">attempt {build.compile_attempts}</span>}
        </p>
      </div>

      {build.status === "failed" && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-loss">The compiler failed {build.compile_attempts} times.</p>
          {licensing && (
            <button className="btn-ghost" disabled={busy} onClick={() => run(() => post(`/admin/builds/${build.id}/retry`))}>
              Retry compile
            </button>
          )}
        </div>
      )}
      {build.compile_log && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-ink-300">Compiler log</summary>
          <pre className="num mt-2 max-h-64 overflow-auto rounded-lg border border-ink-700 bg-ink-950 p-3 text-xs text-ink-300">
            {build.compile_log}
          </pre>
        </details>
      )}

      {licensing && (
      <details className="mt-3 text-sm" open={build.status === "failed"}>
        <summary className="cursor-pointer text-ink-300">Compile by hand</summary>
        <p className="mt-2 text-xs text-ink-400">
          Save this as <span className="num">TradePilotLicenseData.mqh</span> next to TradePilot.mq5, compile, then upload the
          .ex5.
        </p>
        <div className="relative mt-2">
          <pre className="num overflow-x-auto rounded-lg border border-ink-700 bg-ink-950 p-4 text-xs leading-relaxed text-brand">
            {build.license_data}
          </pre>
          <button onClick={copy} className="btn-ghost absolute top-2 right-2 px-2.5 py-1 text-xs">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <form onSubmit={upload} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            name="file"
            accept=".ex5"
            required
            className="text-sm text-ink-300 file:mr-3 file:rounded-md file:border-0 file:bg-ink-700 file:px-3 file:py-2 file:text-ink-100"
          />
          <span className="text-xs text-ink-400">
            saves as <span className="num">{build.file_name}</span>
          </span>
          <button className="btn-primary sm:ml-auto" disabled={busy}>
            {busy && <Spinner />}
            Upload & notify client
          </button>
        </form>
      </details>
      )}
      <div className="mt-2">
        <ErrorNote message={error} />
      </div>
    </div>
  );
}

export function Delivered() {
  const licensing = useCan("licensing");
  const { data, mutate } = useSWR<AdminBuild[]>("/admin/builds?status=downloaded", fetcher);
  const { data: ready, mutate: mutateReady } = useSWR<AdminBuild[]>("/admin/builds?status=ready", fetcher);
  const rows = [...(ready ?? []), ...(data ?? [])];
  const [error, setError] = useState<string | null>(null);

  async function act(path: string, body?: unknown, confirm?: string) {
    if (confirm && !window.confirm(confirm)) return;
    setError(null);
    try {
      await post(path, body);
      await Promise.all([mutate(), mutateReady()]);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-3">
      <ErrorNote message={error} />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-ink-400">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Licensed until</th>
              <th className="px-4 py-3">Running on</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Download IPs</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {rows.map((b) => (
              <tr key={b.id} className="align-top">
                <td className="num px-4 py-3">{b.order_code}</td>
                <td className="px-4 py-3">{b.customer_email}</td>
                <td className="num px-4 py-3">{shortDate(b.expires_at)}</td>
                <td className="px-4 py-3 text-xs">
                  {b.running.length === 0 && <span className="text-ink-400">not seen yet</span>}
                  {b.running.slice(0, 4).map((r) => (
                    <span key={`${r.mt5_login}-${r.last_seen}`} className="block">
                      <span className="num">{r.mt5_login}</span>{" "}
                      <span className={r.status === "ok" ? "text-ok" : "text-amber"}>{r.status}</span>{" "}
                      <span className="text-ink-400">{ago(r.last_seen)}</span>
                    </span>
                  ))}
                </td>
                <td className="px-4 py-3">
                  {b.revoked_at ? <Chip tone="red">revoked</Chip> : <StatusChip status={b.status} />}
                </td>
                <td className="num px-4 py-3">
                  {b.download_ips >= 4 ? <Chip tone="red">{b.download_ips} — check sharing</Chip> : b.download_ips}
                </td>
                <td className="space-x-3 px-4 py-3 text-right text-xs whitespace-nowrap">
                  {!licensing ? null : b.revoked_at ? (
                    <button className="text-brand hover:underline" onClick={() => act(`/admin/builds/${b.id}/revoke`, { revoked: false })}>
                      Restore
                    </button>
                  ) : (
                    <button
                      className="text-loss hover:underline"
                      onClick={() => act(`/admin/builds/${b.id}/revoke`, { revoked: true }, `Stop ${b.order_code}'s EA at its next licence check?`)}
                    >
                      Revoke
                    </button>
                  )}
                  {licensing && <button
                    className="text-ink-300 hover:text-brand"
                    onClick={() =>
                      act(
                        `/admin/subscriptions/${b.subscription_id}/rebuild`,
                        undefined,
                        `Build a new file with a new key for ${b.order_code}? The current file stops working once it's delivered.`,
                      )
                    }
                  >
                    Rebuild
                  </button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-ink-400">Nothing delivered yet.</p>}
      </div>
    </div>
  );
}

// ---- orders ----

export function Orders() {
  const finance = useCan("finance");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const qs = new URLSearchParams({ ...(q && { q }), ...(status && { status }) }).toString();
  const { data, mutate } = useSWR<AdminOrder[]>(`/admin/orders${qs ? `?${qs}` : ""}`, fetcher);
  const [error, setError] = useState<string | null>(null);

  async function act(order: AdminOrder, action: "activate" | "refund") {
    const note =
      action === "activate"
        ? window.prompt(`Activate ${order.code} manually? Enter a reference (e.g. a transaction hash) or a note:`)
        : window.confirm(`Mark ${order.code} refunded? Send the money back yourself first.`)
          ? ""
          : null;
    if (note === null) return;
    setError(null);
    try {
      if (action === "activate") {
        const looksLikeReceipt = /^[A-Z0-9]{10}$/.test(note.trim());
        await post(`/admin/orders/${order.id}/activate`, {
          receipt: looksLikeReceipt ? note.trim() : null,
          note: note.trim() || "manual",
        });
      } else {
        await post(`/admin/orders/${order.id}/refund`);
      }
      mutate();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input className="input" placeholder="Search code, email or receipt" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {["pending", "paid", "underpaid", "failed", "refunded", "cancelled"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <ErrorNote message={error} />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-ink-400">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Receipt / ref</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {data?.map((o) => (
              <tr key={o.id}>
                <td className="num px-4 py-3">
                  {o.code}
                  <span className="block text-xs text-ink-400">{shortDate(o.created_at)}</span>
                </td>
                <td className="px-4 py-3">{o.customer_email}</td>
                <td className="px-4 py-3">
                  {o.plan.name}
                  <span className="block text-xs text-ink-400">
                    {o.kind}
                  </span>
                </td>
                <td className="num px-4 py-3">
                  {usd(o.amount)}
                  {o.status === "underpaid" && <span className="block text-xs text-amber">got {usd(o.amount_paid)}</span>}
                </td>
                <td className="px-4 py-3">
                  <StatusChip status={o.status} />
                  {o.failure_reason && <span className="mt-1 block max-w-48 text-xs text-ink-400">{o.failure_reason}</span>}
                </td>
                <td className="num px-4 py-3 text-xs text-ink-300">{o.receipt ?? o.gateway_ref ?? "—"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {finance && ["pending", "failed", "underpaid"].includes(o.status) && (
                    <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => act(o, "activate")}>
                      Activate
                    </button>
                  )}
                  {finance && o.status === "paid" && (
                    <button className="btn-danger px-2.5 py-1 text-xs" onClick={() => act(o, "refund")}>
                      Refund
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.length === 0 && <p className="p-6 text-center text-ink-400">No orders match.</p>}
      </div>
    </div>
  );
}

// ---- plans ----

type Draft = {
  name: string;
  description: string;
  badge: string;
  highlight: boolean;
  days: string;
  price_usd: string;
  live_slots: string;
  demo_slots: string;
  features: string;
  discount_percent: string;
  discount_label: string;
  discount_ends: string; // yyyy-mm-dd, local
  sort_order: string;
  active: boolean;
  lifetime: boolean;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  description: "",
  badge: "",
  highlight: false,
  days: "30",
  price_usd: "",
  live_slots: "1",
  demo_slots: "1",
  features: "",
  discount_percent: "0",
  discount_label: "",
  discount_ends: "",
  sort_order: "0",
  active: true,
  lifetime: false,
};

function toDraft(p: AdminPlan): Draft {
  return {
    name: p.name,
    description: p.description,
    badge: p.badge ?? "",
    highlight: p.highlight,
    days: String(p.days),
    price_usd: String(p.price_usd),
    live_slots: String(p.live_slots),
    demo_slots: String(p.demo_slots),
    features: p.features.join("\n"),
    discount_percent: String(p.discount_percent),
    discount_label: p.discount_label ?? "",
    discount_ends: p.discount_ends_at ? localDate(p.discount_ends_at) : "",
    sort_order: String(p.sort_order),
    active: p.active,
    lifetime: p.lifetime,
  };
}

function localDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The card exactly as customers will see it (prices worked out like the server does). */
function previewPlan(d: Draft, code = "preview"): Plan {
  const endsAt = d.discount_ends ? new Date(`${d.discount_ends}T23:59:59`).toISOString() : null;
  const pct = Number(d.discount_percent) || 0;
  const live = pct > 0 && (!endsAt || new Date(endsAt) > new Date()) ? pct : 0;
  const usd = Number(d.price_usd) || 0;
  return {
    code,
    lifetime: d.lifetime,
    name: d.name || "Plan name",
    description: d.description,
    features: d.features.split("\n").map((f) => f.trim()).filter(Boolean),
    badge: d.badge.trim() || null,
    highlight: d.highlight,
    days: Number(d.days) || 0,
    price_usd: usd.toFixed(2),
    discount: live,
    discount_label: d.discount_label.trim() || null,
    discount_ends_at: endsAt,
    price_usd_now: ((usd * (100 - live)) / 100).toFixed(2),
    live_slots: Number(d.live_slots) || 0,
    demo_slots: Number(d.demo_slots) || 0,
  };
}

export function Plans() {
  const finance = useCan("finance");
  const [showArchived, setShowArchived] = useState(false);
  const { data, mutate } = useSWR<AdminPlan[]>(`/admin/plans${showArchived ? "?archived=true" : ""}`, fetcher);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!data) return <Spinner />;

  async function remove(plan: AdminPlan) {
    if (!window.confirm(`Delete the "${plan.name}" card? Plans that already have orders are archived instead.`)) return;
    setError(null);
    try {
      const r = await api<{ deleted: boolean; archived: boolean }>(`/admin/plans/${plan.id}`, { method: "DELETE" });
      setNotice(r.deleted ? `"${plan.name}" deleted.` : `"${plan.name}" has orders, so it was archived (hidden from the site).`);
      await mutate();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function restore(plan: AdminPlan) {
    setError(null);
    try {
      await put(`/admin/plans/${plan.id}`, { archived: false, active: true });
      setNotice(`"${plan.name}" is back on the site.`);
      await mutate();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const done = (msg: string) => {
    setEditing(null);
    setNotice(msg);
    mutate();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-300">Design the pricing cards customers see. Changes apply to new orders immediately.</p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-ink-300">
            <input type="checkbox" className="accent-brand" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived
          </label>
          {finance && (
            <button className="btn-primary" onClick={() => setEditing("new")}>
              + New plan
            </button>
          )}
        </div>
      </div>
      {notice && <p className="text-sm text-ok">{notice}</p>}
      <ErrorNote message={error} />

      {editing === "new" && <PlanForm onCancel={() => setEditing(null)} onSaved={done} />}

      <div className="grid gap-5 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
        {data.map((p) =>
          editing === p.id ? (
            <div key={p.id} className="col-span-full">
              <PlanForm plan={p} onCancel={() => setEditing(null)} onSaved={done} />
            </div>
          ) : (
            <div key={p.id} className={`flex flex-col gap-3 ${p.archived_at || !p.active ? "opacity-60" : ""}`}>
              <div className="flex-1">
                <PlanCard plan={p} preview />
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="num text-xs text-ink-400">
                  {p.code}
                  {p.archived_at ? " · archived" : !p.active ? " · hidden" : ""}
                  {p.discount_percent > 0 && p.discount === 0 ? " · discount ended" : ""}
                </span>
                <span className="flex gap-2">
                  {!finance ? null : p.archived_at ? (
                    <button className="btn-ghost px-3 py-1.5" onClick={() => restore(p)}>
                      Restore
                    </button>
                  ) : (
                    <>
                      <button className="btn-ghost px-3 py-1.5" onClick={() => setEditing(p.id)}>
                        Edit
                      </button>
                      <button className="btn-danger px-3 py-1.5" onClick={() => remove(p)}>
                        Delete
                      </button>
                    </>
                  )}
                </span>
              </div>
            </div>
          ),
        )}
        {finance && editing !== "new" && (
          <button
            onClick={() => setEditing("new")}
            className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-600 text-ink-400 transition hover:border-brand hover:text-brand"
          >
            <span className="text-3xl">+</span>
            New plan card
          </button>
        )}
      </div>
    </div>
  );
}

function PlanForm({ plan, onCancel, onSaved }: { plan?: AdminPlan; onCancel: () => void; onSaved: (msg: string) => void }) {
  const [d, setD] = useState<Draft>(plan ? toDraft(plan) : EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((prev) => ({ ...prev, [key]: value }));

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const preview = previewPlan(d);
    const body = {
      name: d.name.trim(),
      description: d.description.trim(),
      features: preview.features,
      badge: preview.badge,
      highlight: d.highlight,
      days: Number(d.days),
      price_usd: Number(d.price_usd).toFixed(2),
      live_slots: Number(d.live_slots),
      demo_slots: Number(d.demo_slots),
      discount_percent: Number(d.discount_percent) || 0,
      discount_label: preview.discount_label,
      discount_ends_at: preview.discount_ends_at,
      sort_order: Number(d.sort_order) || 0,
      active: d.active,
      lifetime: d.lifetime,
    };
    setBusy(true);
    setError(null);
    try {
      if (plan) await put(`/admin/plans/${plan.id}`, body);
      else await post("/admin/plans", body);
      onSaved(plan ? `"${body.name}" saved.` : `"${body.name}" created.`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const input = (key: keyof Draft, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={`pf-${key}`}>{label}</label>
      <input
        id={`pf-${key}`}
        className={`input ${props.type === "number" ? "num" : ""}`}
        value={String(d[key])}
        onChange={(e) => set(key, e.target.value as never)}
        {...props}
      />
    </div>
  );

  return (
    <form onSubmit={save} className="card grid gap-6 p-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <h3 className="font-semibold">{plan ? `Edit ${plan.name}` : "New plan card"}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {input("name", "Name", { required: true, maxLength: 64, placeholder: "e.g. Pro Monthly" })}
          {input("badge", "Badge (optional)", { maxLength: 24, placeholder: "e.g. Best value" })}
        </div>
        {input("description", "Short description (optional)", { maxLength: 280 })}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {input("days", "Days", { type: "number", min: 1, max: 3650, required: !d.lifetime, disabled: d.lifetime })}
          {input("price_usd", "Price (USDT)", { type: "number", min: 0.5, step: 0.01, required: true })}
          {input("live_slots", "Live accts", { type: "number", min: 0, max: 10, required: true })}
          {input("demo_slots", "Demo accts", { type: "number", min: 0, max: 10, required: true })}
        </div>
        <div>
          <label className="label" htmlFor="pf-features">Features (one per line — leave empty for the standard list)</label>
          <textarea
            id="pf-features"
            rows={4}
            className="input"
            value={d.features}
            onChange={(e) => set("features", e.target.value)}
            placeholder={"Priority support\nWeekly setfile updates"}
          />
        </div>
        <fieldset className="rounded-lg border border-ink-700 p-4">
          <legend className="px-1 text-xs font-semibold tracking-wider text-ink-300 uppercase">Discount</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {input("discount_percent", "Percent off", { type: "number", min: 0, max: 90 })}
            {input("discount_label", "Label (optional)", { maxLength: 40, placeholder: "e.g. Launch offer" })}
            {input("discount_ends", "Ends on (optional)", { type: "date" })}
          </div>
          <p className="mt-2 text-xs text-ink-400">Taken off the USDT price. 0 turns it off.</p>
        </fieldset>
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-brand" checked={d.active} onChange={(e) => set("active", e.target.checked)} />
            Show on the site
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-brand" checked={d.highlight} onChange={(e) => set("highlight", e.target.checked)} />
            Highlight this card
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-brand" checked={d.lifetime} onChange={(e) => set("lifetime", e.target.checked)} />
            Lifetime access (one payment, never expires)
          </label>
          <div className="flex items-center gap-2">
            <label htmlFor="pf-sort_order" className="text-ink-300">Position</label>
            <input
              id="pf-sort_order"
              type="number"
              className="input num w-20 py-1.5"
              value={d.sort_order}
              onChange={(e) => set("sort_order", e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={busy}>
            {busy && <Spinner />}
            {plan ? "Save changes" : "Create plan"}
          </button>
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <ErrorNote message={error} />
        </div>
        {plan && plan.code && <p className="num text-xs text-ink-400">Link: /checkout?plan={plan.code}</p>}
      </div>
      <div>
        <p className="label">Preview</p>
        <PlanCard plan={previewPlan(d, plan?.code)} preview />
      </div>
    </form>
  );
}

// ---- payment issues ----

export function Payments() {
  const finance = useCan("finance");
  const { data, mutate } = useSWR<WebhookEvent[]>("/admin/payments/unmatched", fetcher);
  if (!data) return <Loading />;

  async function dismiss(ev: WebhookEvent) {
    await post(`/admin/payments/${ev.id}/dismiss`);
    mutate();
  }

  return (
    <Section title="Payment notices that need a look" description="Crypto payment notices that couldn't be matched to an order, or arrived for an order that was already closed.">
      {data.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="All clear" body="Every payment notice was matched to its order." />
      ) : (
        <ul className="space-y-3">
          {data.map((ev) => {
            const p = ev.payload as Record<string, string>;
            return (
              <li key={ev.id} className="rounded-xl border border-fg/[0.06] bg-fg/[0.02] p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-4 w-4 text-amber" />
                      {p.order_id ? `Order ${p.order_id}` : ev.event_key}
                      {p.price_amount && <span className="num text-ink-300">· ${p.price_amount}</span>}
                      {p.payment_status && <Chip>{p.payment_status}</Chip>}
                    </p>
                    <p className="mt-1 text-xs text-ink-400">
                      {ev.error} · {ago(ev.received_at)}
                    </p>
                  </div>
                  {finance && (
                    <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => dismiss(ev)}>
                      Dismiss
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

// ---- referrals ----

export function Referrals() {
  const finance = useCan("finance");
  const { data, mutate } = useSWR<AdminReferrals>("/admin/referrals", fetcher);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!data) return <Loading />;
  const s = data.settings;

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await put("/admin/referrals/settings", {
        enabled: fd.get("enabled") === "on",
        tier1_percent: String(fd.get("tier1_percent")),
        tier2_percent: String(fd.get("tier2_percent")),
        tier1_repeat_percent: String(fd.get("tier1_repeat_percent")),
        min_withdrawal_usd: String(fd.get("min_withdrawal_usd")),
        hold_days: Number(fd.get("hold_days")),
      });
      setMsg("Saved — applies to payments from now on.");
      await mutate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={BadgeCheck} label="Referred customers" value={data.referred_users} />
        <StatCard icon={Wallet} label="Rewards credited" value={usd(data.total_usd)} tone="green" />
        <StatCard icon={ShieldCheck} label="Resubscriptions" value={`${Number(s.tier1_repeat_percent)}%`} hint="tier 1 on every later payment" tone="amber" />
      </div>

      <Section
        title="Referral rewards"
        description="A new customer's first payment earns the person who invited them (tier 1) and that person's referrer (tier 2). Every later payment — resubscriptions and upgrades — earns tier 1 only, at the resubscription rate. Rewards are credit; refunds take them back."
      >
        <form onSubmit={save} className="space-y-5">
          <fieldset disabled={!finance} className="space-y-5 disabled:opacity-70">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Field label="Tier 1 · first payment %" name="tier1_percent" defaultValue={Number(s.tier1_percent)} step={0.5} min={0} max={50} />
            <Field label="Tier 1 · resubscriptions %" name="tier1_repeat_percent" defaultValue={Number(s.tier1_repeat_percent)} step={0.5} min={0} max={50} />
            <Field label="Tier 2 · first payment %" name="tier2_percent" defaultValue={Number(s.tier2_percent)} step={0.5} min={0} max={50} />
            <Field label="Min. withdrawal (USDT)" name="min_withdrawal_usd" defaultValue={Number(s.min_withdrawal_usd)} step={1} min={1} />
            <Field label="Hold period (days)" name="hold_days" defaultValue={s.hold_days} step={1} min={0} max={90} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="enabled" defaultChecked={s.enabled} className="accent-brand" /> Referral programme on
          </label>
          </fieldset>
          {finance && (
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn-primary" disabled={busy}>
                {busy && <Spinner />} Save
              </button>
              {msg && <span className="text-sm text-ok">{msg}</span>}
              <ErrorNote message={error} />
            </div>
          )}
        </form>
      </Section>

      <Section title="Top referrers">
        {data.top.length === 0 ? (
          <EmptyState icon={BadgeCheck} title="No referrals yet" />
        ) : (
          <Table head={["Member", "Code", "Invited", "Earned"]}>
            {data.top.map((t) => (
              <tr key={t.email}>
                <td className="px-4 py-3">
                  {t.full_name} <span className="text-ink-400">· {t.email}</span>
                </td>
                <td className="num px-4 py-3">{t.referral_code}</td>
                <td className="num px-4 py-3">{t.referred}</td>
                <td className="num px-4 py-3">{usd(t.earned_usd)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      <Section title="Recent rewards">
        {data.rewards.length === 0 ? (
          <EmptyState icon={BadgeCheck} title="No rewards yet" />
        ) : (
          <Table head={["When", "Order", "Paid to", "Tier", "Amount", "Buyer"]}>
            {data.rewards.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-ink-400">{shortDate(r.created_at)}</td>
                <td className="num px-4 py-3">{r.order_code}</td>
                <td className="px-4 py-3">{r.beneficiary_email}</td>
                <td className="num px-4 py-3">
                  {r.tier} · {Number(r.percent)}%
                </td>
                <td className={`num px-4 py-3 ${r.status === "reversed" ? "text-ink-400 line-through" : "text-ok"}`}>{usd(r.amount)}</td>
                <td className="px-4 py-3 text-ink-400">{r.buyer_email}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
    </div>
  );
}

function Field(props: { label: string; name: string; defaultValue: number; step?: number; min?: number; max?: number }) {
  return (
    <div>
      <label className="label" htmlFor={`f-${props.name}`}>{props.label}</label>
      <input id={`f-${props.name}`} name={props.name} type="number" className="input num" required defaultValue={props.defaultValue} step={props.step} min={props.min} max={props.max} />
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-ink-400">
          <tr className="border-b border-fg/[0.06]">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-fg/[0.04]">{children}</tbody>
      </table>
    </div>
  );
}

// ---- withdrawals ----

const RISK: Record<string, { tone: "green" | "amber" | "red"; label: string; icon: typeof ShieldCheck }> = {
  ok: { tone: "green", label: "Looks legit", icon: ShieldCheck },
  review: { tone: "amber", label: "Review", icon: ShieldAlert },
  block: { tone: "red", label: "Blocked", icon: ShieldAlert },
};

export function Withdrawals() {
  const [filter, setFilter] = useState("pending");
  const { data, mutate } = useSWR<AdminWithdrawal[]>(`/admin/withdrawals${filter ? `?status=${filter}` : ""}`, fetcher, { refreshInterval: 15000 });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {[
          ["pending", "To review"],
          ["awaiting_2fa", "Needs 2FA"],
          ["processing", "Sending"],
          ["paid", "Paid"],
          ["rejected", "Rejected"],
          ["", "All"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${filter === value ? "bg-brand/15 text-brand-light" : "text-ink-300 hover:bg-fg/[0.04]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {!data ? (
        <Loading />
      ) : data.length === 0 ? (
        <Section>
          <EmptyState icon={Wallet} title="Nothing here" body="Withdrawal requests appear here with an automatic legitimacy check." />
        </Section>
      ) : (
        data.map((w) => <WithdrawalCard key={w.id} w={w} onDone={() => mutate()} />)
      )}
    </div>
  );
}

function WithdrawalCard({ w, onDone }: { w: AdminWithdrawal; onDone: () => void }) {
  const finance = useCan("finance");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const risk = RISK[w.risk_level] ?? RISK.review;

  async function act(name: string, path: string, body?: unknown) {
    setBusy(name);
    setError(null);
    try {
      await post(`/admin/withdrawals/${w.id}/${path}`, body ?? {});
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  function approve() {
    if (w.risk_level === "block") {
      if (!window.confirm("The automatic check blocked this withdrawal. Pay it anyway?")) return;
      return act("approve", "approve", { override: true });
    }
    if (!window.confirm(`Send ${usd(w.amount)} USDT to ${w.address}?`)) return;
    act("approve", "approve");
  }

  function reject() {
    const reason = window.prompt("Reason for declining (shown to the customer):");
    if (reason) act("reject", "reject", { reason });
  }

  function verify() {
    const code = window.prompt("6-digit code from your NOWPayments authenticator / email:");
    if (code) act("verify", "verify", { code });
  }

  function markPaid() {
    const tx = window.prompt("Transaction hash of the payment you sent by hand:");
    if (tx) act("paid", "mark-paid", { tx_hash: tx });
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div>
          <p className="flex flex-wrap items-center gap-2">
            <span className="num text-xl font-bold">{usd(w.amount)}</span>
            <Chip tone="blue">USDT · {w.network.toUpperCase()}</Chip>
            <StatusChip status={w.status} />
          </p>
          <p className="mt-1 text-sm text-ink-300">
            {w.user_name} · {w.user_email}
          </p>
          <p className="num mt-1 text-xs break-all text-ink-400">{w.address}</p>
          <p className="mt-1 text-xs text-ink-400">
            Requested {ago(w.created_at)}
            {w.tx_hash && <span className="num"> · tx {w.tx_hash}</span>}
            {w.provider_status && <span> · NOWPayments: {w.provider_status}</span>}
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
            risk.tone === "green" ? "border-ok/25 bg-ok/10 text-ok" : risk.tone === "amber" ? "border-amber/25 bg-amber/10 text-amber" : "border-loss/25 bg-loss/10 text-loss"
          }`}>
            <risk.icon className="h-4 w-4" /> {risk.label}
          </span>
          <p className="num mt-1 text-xs text-ink-400">risk score {w.risk_score}/100</p>
        </div>
      </div>

      <ul className="grid gap-px border-y border-fg/[0.05] bg-fg/[0.03] sm:grid-cols-2">
        {w.risk_report.map((f: RiskFinding) => (
          <li key={f.check} className="flex items-start gap-2.5 bg-ink-900 px-5 py-3 text-sm">
            {f.level === "pass" ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
            ) : f.level === "warn" ? (
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
            ) : (
              <X className="mt-0.5 h-4 w-4 shrink-0 text-loss" />
            )}
            <span className={f.level === "pass" ? "text-ink-300" : "text-ink-100"}>{f.message}</span>
          </li>
        ))}
      </ul>

      {finance && (w.status === "pending" || w.status === "awaiting_2fa") && (
        <div className="flex flex-wrap items-center gap-2 p-5">
          {w.status === "pending" && (
            <>
              <button className="btn-primary" onClick={approve} disabled={!!busy}>
                {busy === "approve" ? <Spinner /> : <Check className="h-4 w-4" />} Approve & send
              </button>
              <button className="btn-danger" onClick={reject} disabled={!!busy}>
                Reject
              </button>
            </>
          )}
          {w.status === "awaiting_2fa" && (
            <button className="btn-primary" onClick={verify} disabled={!!busy}>
              {busy === "verify" ? <Spinner /> : <KeyRound className="h-4 w-4" />} Enter 2FA code
            </button>
          )}
          <button className="btn-ghost" onClick={markPaid} disabled={!!busy}>
            Mark paid by hand
          </button>
          {w.failure_reason && <span className="text-xs text-amber">{w.failure_reason}</span>}
        </div>
      )}
      {error && (
        <div className="px-5 pb-5">
          <ErrorNote message={error} />
        </div>
      )}
    </div>
  );
}

// ---- payment settings ----

export function PaymentSettingsPanel() {
  const finance = useCan("finance");
  const { data, mutate } = useSWR<PaymentSettings>("/admin/settings/payments", fetcher);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null);
  if (!data) return <Loading />;

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body: Record<string, unknown> = {
      crypto_enabled: true,
      nowpayments_sandbox: fd.get("mode") === "sandbox",
    };
    // Blank fields keep what's saved.
    for (const key of ["nowpayments_api_key", "nowpayments_ipn_secret", "nowpayments_email", "nowpayments_password", "nowpayments_2fa_secret"]) {
      const v = String(fd.get(key) ?? "").trim();
      if (v) body[key] = v;
    }
    setBusy(true);
    setError(null);
    setMsg(null);
    setTest(null);
    try {
      await put("/admin/settings/payments", body);
      form.reset();
      setMsg("Saved.");
      await mutate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function runTest() {
    setTest(null);
    try {
      setTest(await post<{ ok: boolean; message: string }>("/admin/settings/payments/test"));
    } catch (err) {
      setTest({ ok: false, message: (err as Error).message });
    }
  }

  const secret = (name: string, label: string, saved: string | boolean | null, hint?: string) => (
    <div>
      <label className="label" htmlFor={`s-${name}`}>{label}</label>
      <input
        id={`s-${name}`}
        name={name}
        type={name === "nowpayments_email" ? "email" : "password"}
        autoComplete="off"
        className="input num"
        placeholder={saved ? (typeof saved === "string" ? `saved (${saved}) — type to replace` : "saved — type to replace") : "not set"}
      />
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );

  return (
    <form onSubmit={save} className="space-y-6" key={JSON.stringify(data)}>
      <Section
        title="NOWPayments — receiving payments"
        description="Customers pay USDT invoices created with these keys."
        action={data.crypto_ready ? <Chip tone="green">Configured</Chip> : <Chip tone="amber">Not configured</Chip>}
      >
        <div className="flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="live" defaultChecked={!data.nowpayments_sandbox} className="accent-brand" /> Live (real payments)
          </label>
          <label className={`flex items-center gap-2 ${data.sandbox_allowed ? "" : "opacity-50"}`}>
            <input type="radio" name="mode" value="sandbox" defaultChecked={data.nowpayments_sandbox} disabled={!data.sandbox_allowed} className="accent-brand" />
            Sandbox (test money{data.sandbox_allowed ? "" : " — disabled in production"})
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {secret("nowpayments_api_key", "API key", data.api_key_hint)}
          {secret("nowpayments_ipn_secret", "IPN secret", data.ipn_secret_set)}
        </div>
        <div className="mt-5 rounded-xl border border-fg/[0.06] bg-fg/[0.02] p-4 text-sm text-ink-300">
          <p className="font-medium text-ink-100">In your NOWPayments dashboard</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Settings → Payments → API keys: create a key and paste it above.</li>
            <li>Settings → Payments → IPN: generate an IPN secret and paste it above.</li>
            <li>
              Set the IPN callback URL to <span className="num text-brand-light">{data.ipn_url}</span>
            </li>
            <li>Coins: enable USDT (TRC20) and USDT (BSC), and set your payout wallet.</li>
          </ol>
          {data.ipn_url.includes("://localhost") && (
            <p className="mt-3 text-amber">This site runs on localhost, so NOWPayments can&apos;t reach the IPN URL: payments won&apos;t confirm automatically until it&apos;s on a public domain.</p>
          )}
        </div>
      </Section>

      <Section
        title="NOWPayments — referral payouts"
        description="Approved withdrawals are paid from your NOWPayments custody balance. Save the account login; add the authenticator secret so approvals verify themselves (one click)."
        action={data.payouts_ready ? <Chip tone="green">Payouts ready</Chip> : <Chip tone="amber">Payouts off</Chip>}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {secret("nowpayments_email", "Account email", data.payout_email)}
          {secret("nowpayments_password", "Account password", data.payout_password_set)}
          {secret("nowpayments_2fa_secret", "2FA secret (optional)", data.twofa_secret_set, "The base32 key shown when you set up the authenticator app.")}
        </div>
        <p className="mt-3 text-xs text-ink-400">
          In NOWPayments: activate Custody, top up your USDT balance, and whitelist this server&apos;s IP for payouts. All secrets are stored encrypted and never shown again.
        </p>
      </Section>

      {finance && <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" disabled={busy}>
          {busy && <Spinner />} Save settings
        </button>
        <button type="button" className="btn-ghost" onClick={runTest} disabled={!data.api_key_hint}>
          Test connection
        </button>
        {msg && <span className="text-sm text-ok">{msg}</span>}
        {test && <span className={`text-sm ${test.ok ? "text-ok" : "text-loss"}`}>{test.message}</span>}
        <ErrorNote message={error} />
      </div>}
    </form>
  );
}
