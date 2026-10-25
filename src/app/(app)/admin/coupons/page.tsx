"use client";

import { Copy, Pencil, Plus, TicketPercent, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import useSWR from "swr";

import { Stagger, StaggerItem } from "@/components/motion";
import { Chip, EmptyState, ErrorNote, Loading, PageHeader, Spinner } from "@/components/ui";
import { can, del, fetcher, post, put, shortDate, usd, type AdminPlan, type Coupon } from "@/lib/api";
import { useMe } from "@/lib/hooks";

function state(c: Coupon): { label: string; tone: "green" | "gray" | "amber" | "red" } {
  const now = Date.now();
  if (!c.active) return { label: "off", tone: "gray" };
  if (c.expires_at && new Date(c.expires_at).getTime() <= now) return { label: "expired", tone: "red" };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: "scheduled", tone: "amber" };
  if (c.max_redemptions !== null && c.redemptions >= c.max_redemptions) return { label: "used up", tone: "red" };
  return { label: "live", tone: "green" };
}

export default function CouponsPage() {
  const { user } = useMe();
  const { data, mutate } = useSWR<Coupon[]>("/admin/coupons", fetcher);
  const { data: plans } = useSWR<AdminPlan[]>("/admin/plans", fetcher);
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  if (!data || !user) return <Loading />;
  const editable = can(user, "finance");

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Promo codes customers enter at checkout. They come off after any plan discount."
        actions={
          editable && (
            <button className="btn-primary" onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" /> New coupon
            </button>
          )
        }
      />
      <AnimatePresence>{editing && <CouponForm coupon={editing === "new" ? null : editing} plans={plans ?? []} onClose={() => setEditing(null)} onSaved={() => (setEditing(null), mutate())} />}</AnimatePresence>
      {data.length === 0 ? (
        <EmptyState icon={TicketPercent} title="No coupons yet" body="Create a code for a launch, a partner or a win-back campaign." />
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((c) => {
            const s = state(c);
            const limit = c.max_redemptions;
            return (
              <StaggerItem key={c.id}>
                <div className={`card relative h-full overflow-hidden p-5 ${s.label === "live" ? "" : "opacity-80"}`}>
                  <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-brand/10 blur-2xl" />
                  <div className="flex items-start justify-between gap-2">
                    <button className="num flex items-center gap-2 text-lg font-bold tracking-wide" title="Copy code" onClick={() => navigator.clipboard?.writeText(c.code)}>
                      {c.code} <Copy className="h-3.5 w-3.5 text-ink-400" />
                    </button>
                    <Chip tone={s.tone}>{s.label}</Chip>
                  </div>
                  <p className="mt-1 text-3xl font-extrabold text-brand-light">{c.percent_off ? `${c.percent_off}% off` : `${usd(c.amount_off ?? 0)} off`}</p>
                  {c.description && <p className="mt-1 text-sm text-ink-400">{c.description}</p>}
                  <ul className="mt-3 space-y-1 text-xs text-ink-400">
                    <li>
                      {c.redemptions}
                      {limit !== null ? ` / ${limit}` : ""} used · {c.per_user_limit} per customer{c.first_order_only ? " · first orders only" : ""}
                    </li>
                    {c.plan_ids.length > 0 && <li>Plans: {c.plan_ids.map((id) => plans?.find((p) => p.id === id)?.name ?? `#${id}`).join(", ")}</li>}
                    {(c.starts_at || c.expires_at) && (
                      <li>
                        {c.starts_at ? `From ${shortDate(c.starts_at)}` : "Now"} → {c.expires_at ? shortDate(c.expires_at) : "no end"}
                      </li>
                    )}
                  </ul>
                  {limit !== null && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-fg/[0.06]">
                      <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (c.redemptions / limit) * 100)}%` }} transition={{ duration: 0.8 }} />
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-fg/[0.06] pt-3 text-sm">
                    <span>
                      <span className="num font-semibold">{usd(c.revenue)}</span> <span className="text-xs text-ink-400">revenue · {usd(c.discount_given)} given</span>
                    </span>
                    {editable && (
                      <span className="flex gap-1">
                        <button className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-fg/[0.05] hover:text-ink-100" onClick={() => setEditing(c)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-loss/10 hover:text-loss"
                          aria-label="Delete"
                          onClick={async () => {
                            if (!window.confirm(`Delete ${c.code}? Used coupons are switched off instead.`)) return;
                            await del(`/admin/coupons/${c.id}`);
                            mutate();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </>
  );
}

const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const fromLocal = (v: FormDataEntryValue | null) => (v ? new Date(String(v)).toISOString() : null);

function CouponForm({ coupon, plans, onClose, onSaved }: { coupon: Coupon | null; plans: AdminPlan[]; onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState<"percent" | "amount">(coupon?.amount_off ? "amount" : "percent");
  const [planIds, setPlanIds] = useState<number[]>(coupon?.plan_ids ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      code: String(fd.get("code")),
      description: String(fd.get("description") ?? ""),
      percent_off: kind === "percent" ? Number(fd.get("value")) : null,
      amount_off: kind === "amount" ? String(fd.get("value")) : null,
      max_redemptions: fd.get("max_redemptions") ? Number(fd.get("max_redemptions")) : null,
      per_user_limit: Number(fd.get("per_user_limit") || 1),
      first_order_only: fd.get("first_order_only") === "on",
      plan_ids: planIds,
      starts_at: fromLocal(fd.get("starts_at")),
      expires_at: fromLocal(fd.get("expires_at")),
      active: fd.get("active") === "on",
    };
    setBusy(true);
    setError(null);
    try {
      await (coupon ? put(`/admin/coupons/${coupon.id}`, body) : post("/admin/coupons", body));
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
      <form onSubmit={submit} className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{coupon ? `Edit ${coupon.code}` : "New coupon"}</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-fg/[0.05]" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label" htmlFor="c-code">Code</label>
            <input id="c-code" name="code" className="input num uppercase" defaultValue={coupon?.code} required pattern="[A-Za-z0-9_\-]{3,32}" placeholder="LAUNCH20" />
          </div>
          <div>
            <label className="label" htmlFor="c-value">Discount</label>
            <div className="flex gap-2">
              <select className="input w-24" value={kind} onChange={(e) => setKind(e.target.value as "percent" | "amount")} aria-label="Discount type">
                <option value="percent">%</option>
                <option value="amount">USD</option>
              </select>
              <input
                id="c-value"
                name="value"
                type="number"
                className="input num"
                required
                min={kind === "percent" ? 1 : 0.01}
                max={kind === "percent" ? 100 : undefined}
                step={kind === "percent" ? 1 : 0.01}
                defaultValue={coupon?.percent_off ?? coupon?.amount_off ?? ""}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="c-desc">Note shown at checkout</label>
            <input id="c-desc" name="description" className="input" maxLength={140} defaultValue={coupon?.description} placeholder="Launch week offer" />
          </div>
          <div>
            <label className="label" htmlFor="c-max">Total uses</label>
            <input id="c-max" name="max_redemptions" type="number" min={1} className="input num" defaultValue={coupon?.max_redemptions ?? ""} placeholder="Unlimited" />
          </div>
          <div>
            <label className="label" htmlFor="c-per">Uses per customer</label>
            <input id="c-per" name="per_user_limit" type="number" min={1} className="input num" defaultValue={coupon?.per_user_limit ?? 1} />
          </div>
          <div className="flex flex-col justify-end gap-2 pb-1 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="first_order_only" defaultChecked={coupon?.first_order_only} className="accent-brand" /> First orders only
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="active" defaultChecked={coupon?.active ?? true} className="accent-brand" /> Active
            </label>
          </div>
          <div>
            <label className="label" htmlFor="c-start">Starts</label>
            <input id="c-start" name="starts_at" type="datetime-local" className="input" defaultValue={toLocal(coupon?.starts_at ?? null)} />
          </div>
          <div>
            <label className="label" htmlFor="c-end">Ends</label>
            <input id="c-end" name="expires_at" type="datetime-local" className="input" defaultValue={toLocal(coupon?.expires_at ?? null)} />
          </div>
        </div>
        <div>
          <p className="label">Plans</p>
          <div className="flex flex-wrap gap-2">
            {plans
              .filter((p) => !p.archived_at)
              .map((p) => {
                const on = planIds.includes(p.id);
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPlanIds(on ? planIds.filter((x) => x !== p.id) : [...planIds, p.id])}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-brand/40 bg-brand/15 text-ink-100" : "border-fg/[0.08] text-ink-400 hover:text-ink-100"}`}
                  >
                    {p.name}
                  </button>
                );
              })}
          </div>
          <p className="mt-1.5 text-xs text-ink-400">{planIds.length ? "Only the selected plans." : "None selected: works on every plan."}</p>
        </div>
        <ErrorNote message={error} />
        <button className="btn-primary" disabled={busy}>
          {busy ? <Spinner /> : <TicketPercent className="h-4 w-4" />} {coupon ? "Save coupon" : "Create coupon"}
        </button>
      </form>
    </motion.div>
  );
}
