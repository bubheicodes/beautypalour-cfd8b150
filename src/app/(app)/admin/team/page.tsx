"use client";

import { Check, Minus, Search, ShieldAlert, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";

import { Stagger, StaggerItem } from "@/components/motion";
import { ROLE_OPTIONS, ROLE_TONE, RolePicker } from "@/components/roles";
import { Chip, ErrorNote, Loading, PageHeader, Section, Spinner } from "@/components/ui";
import { ago, can, fetcher, put, type Permission, type Role, type RoleInfo, type StaffMember, type UserRow } from "@/lib/api";
import { useMe } from "@/lib/hooks";

const PERMISSION_LABEL: Record<Permission, string> = {
  view: "See customers, orders, builds and tickets",
  "finance.view": "See payments, withdrawals and payment settings",
  analytics: "Business analytics and staff activity",
  "users.manage": "Fix accounts: profile, block, sign out, password reset",
  "users.admin": "Assign roles and adjust credit",
  tickets: "Answer and manage support tickets",
  kb: "Write help-centre articles",
  finance: "Prices, coupons, refunds, payouts, gateway settings",
  licensing: "Builds, licence revocation, licensed accounts",
  settings: "Site settings such as access rules",
  announce: "Send announcements to customers",
};

const ROLES: Role[] = ["admin", "management", "support", "user"];

export default function TeamPage() {
  const { user: me } = useMe();
  const { data: roles } = useSWR<RoleInfo[]>("/admin/roles", fetcher);
  const { data: staff, mutate } = useSWR<StaffMember[]>("/admin/staff", fetcher);
  if (!me || !roles || !staff) return <Loading />;
  const isAdmin = can(me, "users.admin");
  const byRole = Object.fromEntries(roles.map((r) => [r.role, r]));

  return (
    <>
      <PageHeader title="Team & roles" description="Who works on TradePilot, and what each role is allowed to do." />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ROLE_OPTIONS.slice()
          .reverse()
          .map((o) => (
            <StaggerItem key={o.role}>
              <div className="card h-full p-5">
                <div className="flex items-center justify-between">
                  <p className={`font-semibold ${ROLE_TONE[o.role]}`}>{o.label}</p>
                  <span className="num text-2xl font-bold">{byRole[o.role]?.members ?? 0}</span>
                </div>
                <p className="mt-2 text-sm text-ink-400">{o.blurb}</p>
              </div>
            </StaggerItem>
          ))}
      </Stagger>

      {isAdmin && <AddMember onAdded={() => mutate()} />}

      <Section title={`Staff (${staff.length})`} className="mt-6" description="Role changes sign the person out; they get the new access at their next sign-in.">
        <div className="-mx-5 -my-5 overflow-x-auto sm:-mx-6 sm:-my-6">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-ink-400">
              <tr className="border-b border-fg/[0.06]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Two-factor</th>
                <th className="px-4 py-3 font-medium">Last sign-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fg/[0.04]">
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${s.id}`} className="font-medium hover:text-brand-light">
                      {s.full_name} {s.id === me.id && <span className="text-xs text-ink-400">(you)</span>}
                    </Link>
                    <span className="block text-xs text-ink-400">{s.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && s.id !== me.id ? (
                      <RolePicker user={s} onChanged={() => mutate()} />
                    ) : (
                      <span className={`text-xs font-semibold ${ROLE_TONE[s.role]}`}>{ROLE_OPTIONS.find((o) => o.role === s.role)?.label}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {s.two_factor ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-ok">
                        <ShieldCheck className="h-3.5 w-3.5" /> On
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber">
                        <ShieldAlert className="h-3.5 w-3.5" /> Not set up
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-400">{s.last_login_at ? ago(s.last_login_at) : "never"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="What each role can do" className="mt-6">
        <div className="-mx-5 -my-5 overflow-x-auto sm:-mx-6 sm:-my-6">
          <table className="w-full text-sm">
            <thead className="text-xs text-ink-400">
              <tr className="border-b border-fg/[0.06]">
                <th className="px-4 py-3 text-left font-medium">Permission</th>
                {ROLES.map((r) => (
                  <th key={r} className={`px-3 py-3 text-center font-semibold ${ROLE_TONE[r]}`}>
                    {byRole[r]?.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-fg/[0.04]">
              {(Object.keys(PERMISSION_LABEL) as Permission[]).map((p) => (
                <tr key={p}>
                  <td className="px-4 py-2.5 text-ink-300">{PERMISSION_LABEL[p]}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-3 py-2.5 text-center">
                      {byRole[r]?.permissions.includes(p) ? (
                        <Check className="mx-auto h-4 w-4 text-ok" aria-label="Allowed" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-ink-400/50" aria-label="Not allowed" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

/** Find an existing customer account and give it a staff role. */
function AddMember({ onAdded }: { onAdded: () => void }) {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<UserRow | null>(null);
  const [role, setRole] = useState<Role>("support");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 300);
    return () => clearTimeout(t);
  }, [text]);
  const { data } = useSWR<{ items: UserRow[] }>(q.length >= 2 && !picked ? `/admin/users?role=user&per_page=5&q=${encodeURIComponent(q)}` : null, fetcher);

  async function assign() {
    if (!picked) return;
    setBusy(true);
    setError(null);
    try {
      await put(`/admin/users/${picked.id}/role`, { role });
      setDone(`${picked.full_name} is now ${ROLE_OPTIONS.find((o) => o.role === role)?.label}. They'll be asked to set up two-factor login at their next sign-in.`);
      setPicked(null);
      setText("");
      onAdded();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Add a team member" className="mt-6" description="They need a TradePilot account first — ask them to sign up, then find them here.">
      {done && <p className="mb-4 rounded-xl border border-ok/25 bg-ok/10 p-3 text-sm text-ok">{done}</p>}
      <div className="grid gap-3 md:grid-cols-[1fr_200px_auto]">
        <div className="relative">
          {picked ? (
            <div className="input flex items-center justify-between">
              <span className="truncate">
                {picked.full_name} <span className="text-ink-400">· {picked.email}</span>
              </span>
              <button className="text-xs text-ink-400 hover:text-ink-100" onClick={() => setPicked(null)}>
                Change
              </button>
            </div>
          ) : (
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input className="input pl-9" placeholder="Search customers by name or email" value={text} onChange={(e) => setText(e.target.value)} />
            </label>
          )}
          {!picked && q.length >= 2 && data && (
            <ul className="card absolute inset-x-0 top-12 z-20 max-h-64 overflow-y-auto p-1 shadow-2xl">
              {data.items.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-ink-400">No customer matches.</li>
              ) : (
                data.items.map((u) => (
                  <li key={u.id}>
                    <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-fg/[0.05]" onClick={() => setPicked(u)}>
                      <span className="font-medium">{u.full_name}</span>
                      <span className="block text-xs text-ink-400">{u.email}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)} aria-label="Role">
          {ROLE_OPTIONS.filter((o) => o.role !== "user").map((o) => (
            <option key={o.role} value={o.role}>
              {o.label}
            </option>
          ))}
        </select>
        <button className="btn-primary" disabled={!picked || busy} onClick={assign}>
          {busy ? <Spinner /> : <UserPlus className="h-4 w-4" />} Give access
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-400">{ROLE_OPTIONS.find((o) => o.role === role)?.blurb}</p>
      <ErrorNote message={error} />
      {role === "admin" && <Chip tone="red">Admins can change everything, including roles — give this sparingly.</Chip>}
    </Section>
  );
}
