"use client";

import { ArrowLeft, Ban, CircleDollarSign, KeyRound, LogOut, MailCheck, Save, ShieldCheck, ShieldOff, UserCog } from "lucide-react";
import Link from "next/link";
import { use, useMemo, useState, type FormEvent } from "react";
import useSWR from "swr";

import { OrdersTable } from "@/components/dashboard";
import { Reveal } from "@/components/motion";
import { TicketStatus } from "@/components/tickets";
import { Chip, ErrorNote, Loading, PageHeader, Section, Spinner, StatCard, StatusChip } from "@/components/ui";
import { ago, can, fetcher, patch, post, put, shortDate, usd, type ResetLink, type UserDetail } from "@/lib/api";
import { countryName, countryOptions, flag } from "@/lib/countries";
import { useMe } from "@/lib/hooks";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: me } = useMe();
  const { data: u, mutate, error } = useSWR<UserDetail>(`/admin/users/${id}`, fetcher);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const countries = useMemo(() => countryOptions(), []);
  if (error) return <PageHeader title="User not found" />;
  if (!u || !me) return <Loading />;

  const staffTarget = u.role !== "user";
  const canManage = can(me, "users.manage") && (!staffTarget || me.is_admin);

  async function act(name: string, fn: () => Promise<unknown>, done: string) {
    setBusy(name);
    setErr(null);
    setMsg(null);
    try {
      await fn();
      setMsg(done);
      await mutate();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await act(
      "profile",
      () =>
        patch(`/admin/users/${id}`, {
          first_name: fd.get("first_name"),
          last_name: fd.get("last_name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          country: fd.get("country") || undefined,
        }),
      "Profile saved",
    );
  }

  return (
    <>
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100">
        <ArrowLeft className="h-4 w-4" /> All users
      </Link>
      <PageHeader
        title={u.full_name}
        description={
          <>
            {u.email} · joined {shortDate(u.created_at)} · {u.country ? `${flag(u.country)} ${countryName(u.country)}` : "country not given"}
          </>
        }
        actions={
          <>
            <Chip tone={u.role === "user" ? "gray" : "blue"}>{u.role === "user" ? "customer" : u.role}</Chip>
            {u.blocked && <Chip tone="red">blocked</Chip>}
            <Chip tone={u.email_verified ? "green" : "amber"}>{u.email_verified ? "email confirmed" : "email unconfirmed"}</Chip>
            {u.two_factor && <Chip tone="green">2FA on</Chip>}
          </>
        }
      />
      {u.blocked && u.blocked_reason && <p className="mb-4 rounded-xl border border-loss/25 bg-loss/10 p-3 text-sm text-loss">Blocked: {u.blocked_reason}</p>}
      {msg && <p className="mb-4 rounded-xl border border-ok/25 bg-ok/10 p-3 text-sm text-ok">{msg}</p>}
      <div className="mb-4">
        <ErrorNote message={err} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CircleDollarSign} label="Total spent" value={usd(u.paid_total)} hint={`${u.paid_orders} paid order${u.paid_orders === 1 ? "" : "s"}`} tone="green" />
        <StatCard icon={ShieldCheck} label="Active subscriptions" value={u.active_subscriptions} />
        <StatCard icon={UserCog} label="Referred" value={u.referred} hint={u.referred_by ? `invited by ${u.referred_by}` : `code ${u.referral_code}`} />
        <StatCard icon={CircleDollarSign} label="Credit" value={usd(u.credit_usd)} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] [&>*]:min-w-0">
        <div className="space-y-6">
          <Section title="Subscriptions">
            {u.subscriptions.length === 0 ? (
              <p className="text-sm text-ink-400">None.</p>
            ) : (
              <ul className="space-y-2">
                {u.subscriptions.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-fg/[0.02] px-4 py-3 text-sm">
                    <span>
                      <b>{s.plan.name}</b> · {s.plan.lifetime ? "lifetime" : `until ${shortDate(s.expires_at)}`}
                      <span className="block text-xs text-ink-400">{s.accounts.map((a) => `${a.mt5_login} (${a.type}, ${a.broker_server})`).join(" · ")}</span>
                    </span>
                    <StatusChip status={s.status} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="Orders">
            <div className="-mx-5 -mb-5 sm:-mx-6 sm:-mb-6">
              <OrdersTable orders={u.orders} />
            </div>
          </Section>
          <Section title="Support tickets">
            {u.tickets.length === 0 ? (
              <p className="text-sm text-ink-400">None.</p>
            ) : (
              <ul className="divide-y divide-fg/[0.05]">
                {u.tickets.map((t) => (
                  <li key={t.id}>
                    <Link href={`/admin/tickets/${t.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:opacity-80">
                      <span>
                        <span className="num mr-2 text-xs text-ink-400">#{t.number}</span>
                        {t.subject}
                      </span>
                      <TicketStatus status={t.status} staffView />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          {u.withdrawals.length > 0 && (
            <Section title="Withdrawals">
              <ul className="space-y-2 text-sm">
                {u.withdrawals.map((w) => (
                  <li key={w.id} className="flex items-center justify-between rounded-xl bg-fg/[0.02] px-4 py-2.5">
                    <span className="num">
                      {usd(w.amount)} · {w.network.toUpperCase()}
                    </span>
                    <StatusChip status={w.status} />
                  </li>
                ))}
              </ul>
            </Section>
          )}
          <Section title="Activity" description="Staff actions on this account">
            {u.audit.length === 0 ? (
              <p className="text-sm text-ink-400">No staff actions yet.</p>
            ) : (
              <ol className="relative space-y-3 border-l border-fg/[0.08] pl-5 text-sm">
                {u.audit.map((a, i) => (
                  <li key={i} className="relative">
                    <span className="absolute top-1.5 -left-[1.42rem] h-2.5 w-2.5 rounded-full border-2 border-ink-950 bg-brand" />
                    <b className="num text-xs">{a.action}</b> <span className="text-ink-400">by {a.actor ?? "system"} · {ago(a.created_at)}</span>
                    {Object.keys(a.details).length > 0 && <p className="num mt-0.5 truncate text-xs text-ink-400">{JSON.stringify(a.details)}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>

        <aside className="space-y-6">
          <Reveal>
            <Section title="Profile">
              <form onSubmit={saveProfile} className="space-y-3">
                <fieldset disabled={!canManage} className="space-y-3 disabled:opacity-70">
                  <div className="grid grid-cols-2 gap-2">
                    <input name="first_name" className="input" defaultValue={u.first_name} aria-label="First name" placeholder="First name" required maxLength={60} />
                    <input name="last_name" className="input" defaultValue={u.last_name} aria-label="Last name" placeholder="Last name" required maxLength={60} />
                  </div>
                  <input name="email" type="email" className="input" defaultValue={u.email} aria-label="Email" />
                  <input name="phone" className="input num" defaultValue={u.phone} aria-label="Phone" />
                  <select name="country" className="input" defaultValue={u.country ?? ""} aria-label="Country">
                    <option value="">Country —</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </fieldset>
                {canManage && (
                  <button className="btn-primary w-full" disabled={!!busy}>
                    {busy === "profile" ? <Spinner /> : <Save className="h-4 w-4" />} Save profile
                  </button>
                )}
              </form>
              <dl className="mt-4 space-y-1 text-xs text-ink-400">
                <div className="flex justify-between"><dt>Sign-up IP</dt><dd className="num">{u.signup_ip ?? "—"}</dd></div>
                <div className="flex justify-between"><dt>Last login</dt><dd className="num">{u.last_login_at ? `${ago(u.last_login_at)} · ${u.last_login_ip ?? ""}` : "—"}</dd></div>
              </dl>
            </Section>
          </Reveal>

          {canManage && (
            <Reveal delay={0.05}>
              <Section title="Account actions">
                <div className="space-y-2">
                  <button className="btn-ghost w-full justify-start" disabled={!!busy} onClick={() => act("reset", async () => {
                    const r = await post<ResetLink>(`/admin/users/${id}/password-reset`);
                    if (r.url) await navigator.clipboard.writeText(r.url).catch(() => undefined);
                  }, me.is_admin ? "Reset email queued — the link is also on your clipboard" : "Password reset email sent")}>
                    <KeyRound className="h-4 w-4" /> Send password reset
                  </button>
                  {!u.email_verified && (
                    <button className="btn-ghost w-full justify-start" disabled={!!busy} onClick={() => act("verify", () => post(`/admin/users/${id}/verify-email`), "Email marked as confirmed")}>
                      <MailCheck className="h-4 w-4" /> Mark email as confirmed
                    </button>
                  )}
                  {u.two_factor && (
                    <button
                      className="btn-ghost w-full justify-start"
                      disabled={!!busy}
                      onClick={() => {
                        if (window.confirm("Turn off two-factor login for this account? Only do this after confirming who you're talking to — they will be signed out."))
                          act("2fa", () => post(`/admin/users/${id}/reset-2fa`), "Two-factor login reset");
                      }}
                    >
                      <ShieldOff className="h-4 w-4" /> Reset two-factor login
                    </button>
                  )}
                  <button className="btn-ghost w-full justify-start" disabled={!!busy} onClick={() => act("signout", () => post(`/admin/users/${id}/sign-out`), "Signed out of all devices")}>
                    <LogOut className="h-4 w-4" /> Sign out everywhere
                  </button>
                  {u.blocked ? (
                    <button className="btn-ghost w-full justify-start" disabled={!!busy} onClick={() => act("unblock", () => post(`/admin/users/${id}/unblock`), "Unblocked")}>
                      <ShieldCheck className="h-4 w-4" /> Unblock account
                    </button>
                  ) : (
                    <button className="btn-danger w-full justify-start" disabled={!!busy || u.id === me.id} onClick={() => {
                      const reason = window.prompt("Why are you blocking this account? (kept in the audit log)");
                      if (reason) act("block", () => post(`/admin/users/${id}/block`, { reason }), "Blocked and signed out");
                    }}>
                      <Ban className="h-4 w-4" /> Block account
                    </button>
                  )}
                </div>
              </Section>
            </Reveal>
          )}

          {(can(me, "users.admin") || can(me, "finance")) && (
            <Reveal delay={0.1}>
              <Section title="Admin">
                <div className="space-y-4">
                  {can(me, "users.admin") && (
                    <div>
                      <label className="label" htmlFor="role">Role</label>
                      <select id="role" className="input" value={u.role} disabled={!!busy} onChange={(e) => act("role", () => put(`/admin/users/${id}/role`, { role: e.target.value }), "Role changed")}>
                        <option value="user">Customer</option>
                        <option value="support">Support</option>
                        <option value="management">Management</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  )}
                  {can(me, "finance") && (
                    <button className="btn-ghost w-full justify-start" disabled={!!busy} onClick={() => {
                      const amount = window.prompt("Credit to add in USD (negative to remove):");
                      if (!amount) return;
                      const reason = window.prompt("Reason (shown to the customer when adding):");
                      if (reason) act("credit", () => post(`/admin/users/${id}/credit`, { amount, reason }), "Credit adjusted");
                    }}>
                      <CircleDollarSign className="h-4 w-4" /> Adjust credit
                    </button>
                  )}
                </div>
              </Section>
            </Reveal>
          )}
        </aside>
      </div>
    </>
  );
}
