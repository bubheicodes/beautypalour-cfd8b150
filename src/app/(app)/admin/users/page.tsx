"use client";

import { MailWarning, Search, ShieldBan, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

import { RolePicker } from "@/components/roles";
import { Chip, EmptyState, Loading, PageHeader, Section } from "@/components/ui";
import { ago, can, fetcher, usd, type UserRow } from "@/lib/api";
import { useMe } from "@/lib/hooks";
import { flag } from "@/lib/countries";

const ROLE_TONE = { admin: "red", management: "amber", support: "blue", user: "gray" } as const;

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [state, setState] = useState("");
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ page: String(page), ...(q && { q }), ...(role && { role }), ...(state && { state }) }).toString();
  const { data, mutate } = useSWR<{ items: UserRow[]; total: number }>(`/admin/users?${qs}`, fetcher, { keepPreviousData: true });
  const { user: me } = useMe();
  const isAdmin = can(me, "users.admin");
  const pages = data ? Math.max(1, Math.ceil(data.total / 25)) : 1;

  return (
    <>
      <PageHeader title="Users" description={data ? `${data.total} account${data.total === 1 ? "" : "s"}` : undefined} />
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input className="input pl-9" placeholder="Search name, email or phone" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} />
        </label>
        <select className="input w-auto" value={role} onChange={(e) => (setRole(e.target.value), setPage(1))}>
          <option value="">All roles</option>
          <option value="user">Customers</option>
          <option value="support">Support</option>
          <option value="management">Management</option>
          <option value="admin">Admins</option>
        </select>
        <select className="input w-auto" value={state} onChange={(e) => (setState(e.target.value), setPage(1))}>
          <option value="">Any status</option>
          <option value="paying">Paying</option>
          <option value="active">Not blocked</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>
      <Section>
        {!data ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <EmptyState icon={Search} title="No users match" />
        ) : (
          <div className="-mx-5 -my-5 overflow-x-auto sm:-mx-6 sm:-my-6">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-ink-400">
                <tr className="border-b border-fg/[0.06]">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 text-right font-medium">Spent</th>
                  <th className="px-4 py-3 text-right font-medium">Active</th>
                  <th className="px-4 py-3 text-right font-medium">Referred</th>
                  <th className="px-4 py-3 font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fg/[0.04]">
                {data.items.map((u) => (
                  <tr key={u.id} className="transition hover:bg-fg/[0.02]">
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${u.id}`} className="group flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand/30 to-brand-deep/30 text-xs font-bold">
                          {u.full_name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 font-medium group-hover:text-brand-light">
                            {u.full_name} {u.country && <span title={u.country}>{flag(u.country)}</span>}
                            {u.blocked && <ShieldBan className="h-3.5 w-3.5 text-loss" />}
                            {u.two_factor && <ShieldCheck className="h-3.5 w-3.5 text-ok" aria-label="Two-factor login on" />}
                            {!u.email_verified && <MailWarning className="h-3.5 w-3.5 text-amber" aria-label="Email not confirmed" />}
                          </span>
                          <span className="block truncate text-xs text-ink-400">{u.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && u.id !== me?.id ? (
                        <RolePicker user={u} onChanged={() => mutate()} />
                      ) : (
                        <Chip tone={ROLE_TONE[u.role]}>{u.role === "user" ? "customer" : u.role}</Chip>
                      )}
                    </td>
                    <td className="num px-4 py-3 text-right">{usd(u.paid_total)}</td>
                    <td className="num px-4 py-3 text-right">{u.active_subscriptions}</td>
                    <td className="num px-4 py-3 text-right">{u.referred}</td>
                    <td className="px-4 py-3 text-ink-400">{u.last_login_at ? ago(u.last_login_at) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
