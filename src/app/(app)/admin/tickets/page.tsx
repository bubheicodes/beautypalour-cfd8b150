"use client";

import { MessagesSquare, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

import { CATEGORY_LABEL, TicketStatus } from "@/components/tickets";
import { Chip, EmptyState, Loading, PageHeader, Section } from "@/components/ui";
import { ago, fetcher, type Ticket } from "@/lib/api";

const PRIORITY_TONE = { low: "gray", normal: "gray", high: "amber", urgent: "red" } as const;

export default function StaffTicketsPage() {
  const [status, setStatus] = useState("active");
  const [assigned, setAssigned] = useState("");
  const [q, setQ] = useState("");
  const qs = new URLSearchParams({ ...(status && { status }), ...(assigned && { assigned }), ...(q && { q }) }).toString();
  const { data } = useSWR<Ticket[]>(`/admin/tickets?${qs}`, fetcher, { refreshInterval: 20000, keepPreviousData: true });

  return (
    <>
      <PageHeader title="Support tickets" description="Customer questions. Replies are emailed to the customer; internal notes stay private." />
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["active", "Active"],
          ["open", "Needs reply"],
          ["pending", "Awaiting customer"],
          ["resolved", "Resolved"],
          ["", "All"],
        ].map(([v, l]) => (
          <button key={v} onClick={() => setStatus(v)} className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${status === v ? "bg-brand/15 text-brand-light" : "text-ink-300 hover:bg-fg/[0.04]"}`}>
            {l}
          </button>
        ))}
        <select className="input ml-auto w-auto" value={assigned} onChange={(e) => setAssigned(e.target.value)}>
          <option value="">Anyone</option>
          <option value="me">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <label className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input className="input w-56 pl-9" placeholder="Subject, email, order" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      <Section>
        {!data ? (
          <Loading />
        ) : data.length === 0 ? (
          <EmptyState icon={MessagesSquare} title="No tickets here" body="Nice — nothing waiting." />
        ) : (
          <ul className="-my-2 divide-y divide-fg/[0.05]">
            {data.map((t) => (
              <li key={t.id}>
                <Link href={`/admin/tickets/${t.id}`} className="flex flex-wrap items-center gap-3 py-3 transition hover:opacity-80">
                  <span className="num w-14 text-xs text-ink-400">#{t.number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{t.subject}</span>
                    <span className="block truncate text-xs text-ink-400">
                      {t.customer} · {CATEGORY_LABEL[t.category]} · {ago(t.updated_at)}
                      {t.assignee && ` · ${t.assignee}`}
                    </span>
                  </span>
                  {t.priority !== "normal" && <Chip tone={PRIORITY_TONE[t.priority]}>{t.priority}</Chip>}
                  <TicketStatus status={t.status} staffView />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
