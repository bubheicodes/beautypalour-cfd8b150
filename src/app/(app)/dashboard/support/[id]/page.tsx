"use client";

import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import useSWR from "swr";

import { CATEGORY_LABEL, Thread, TicketStatus } from "@/components/tickets";
import { Loading, PageHeader } from "@/components/ui";
import { fetcher, post, shortDate, type TicketDetail } from "@/lib/api";

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, mutate, error } = useSWR<TicketDetail>(`/me/tickets/${id}`, fetcher, { refreshInterval: 15000 });
  if (error) return <PageHeader title="Ticket not found" />;
  if (!data) return <Loading />;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/support" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100">
        <ArrowLeft className="h-4 w-4" /> All tickets
      </Link>
      <PageHeader
        title={data.subject}
        description={`#${data.number} · ${CATEGORY_LABEL[data.category]} · opened ${shortDate(data.created_at)}${data.order_code ? ` · order ${data.order_code}` : ""}`}
        actions={
          <>
            <TicketStatus status={data.status} />
            {data.status !== "closed" && (
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={async () => mutate(await post<TicketDetail>(`/me/tickets/${id}/close`))}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Mark solved
              </button>
            )}
          </>
        }
      />
      <Thread ticket={data} onReply={async (body) => void mutate(await post<TicketDetail>(`/me/tickets/${id}/messages`, { body }))} />
    </div>
  );
}
