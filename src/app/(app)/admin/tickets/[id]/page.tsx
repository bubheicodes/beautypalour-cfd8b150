"use client";

import { ArrowLeft, UserRound } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import useSWR from "swr";

import { CATEGORY_LABEL, Thread, TicketStatus } from "@/components/tickets";
import { Loading, PageHeader, Section } from "@/components/ui";
import { api, can, fetcher, post, shortDate, type StaffMember, type TicketDetail } from "@/lib/api";
import { useMe } from "@/lib/hooks";

export default function StaffTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useMe();
  const { data, mutate, error } = useSWR<TicketDetail>(`/admin/tickets/${id}`, fetcher, { refreshInterval: 15000 });
  const { data: staff } = useSWR<StaffMember[]>("/admin/staff", fetcher);
  if (error) return <PageHeader title="Ticket not found" />;
  if (!data || !user) return <Loading />;
  const editable = can(user, "tickets");

  const update = async (body: Record<string, unknown>) =>
    mutate(await api<TicketDetail>(`/admin/tickets/${id}`, { method: "PATCH", body: JSON.stringify(body) }));

  return (
    <>
      <Link href="/admin/tickets" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100">
        <ArrowLeft className="h-4 w-4" /> All tickets
      </Link>
      <PageHeader
        title={data.subject}
        description={`#${data.number} · ${CATEGORY_LABEL[data.category]} · opened ${shortDate(data.created_at)}${data.order_code ? ` · order ${data.order_code}` : ""}`}
        actions={<TicketStatus status={data.status} staffView />}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px] [&>*]:min-w-0">
        {editable ? (
          <Thread staff ticket={data} onReply={async (body, internal) => void mutate(await post<TicketDetail>(`/admin/tickets/${id}/messages`, { body, internal }))} />
        ) : (
          <Section>
            <Thread staff ticket={{ ...data, status: "closed" }} onReply={async () => undefined} />
          </Section>
        )}
        <aside className="space-y-6">
          <Section title="Customer">
            <Link href={`/admin/users/${data.customer_id}`} className="flex items-center gap-3 rounded-xl bg-fg/[0.02] p-3 text-sm hover:bg-fg/[0.04]">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/15 text-brand-light">
                <UserRound className="h-4 w-4" />
              </span>
              <span className="min-w-0 truncate">{data.customer_email}</span>
            </Link>
            <p className="mt-2 text-xs text-ink-400">Open the profile for orders, licences and account actions.</p>
          </Section>
          {editable && (
            <Section title="Ticket">
              <div className="space-y-3">
                <div>
                  <label className="label" htmlFor="tk-status">Status</label>
                  <select id="tk-status" className="input" value={data.status} onChange={(e) => update({ status: e.target.value })}>
                    <option value="open">Needs reply</option>
                    <option value="pending">Awaiting customer</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="tk-priority">Priority</label>
                  <select id="tk-priority" className="input" value={data.priority} onChange={(e) => update({ priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="tk-assign">Assigned to</label>
                  <select
                    id="tk-assign"
                    className="input"
                    value={staff?.find((s) => s.full_name === data.assignee)?.id ?? ""}
                    onChange={(e) => update(e.target.value ? { assigned_to: e.target.value } : { unassign: true })}
                  >
                    <option value="">Unassigned</option>
                    {staff
                      ?.filter((s) => s.role === "support" || s.role === "admin")
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name} ({s.role})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </Section>
          )}
        </aside>
      </div>
    </>
  );
}
