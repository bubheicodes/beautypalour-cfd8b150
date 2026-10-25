"use client";

import { Headset, Send, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Chip, ErrorNote, Spinner, type Tone } from "@/components/ui";
import { ago, type Ticket, type TicketDetail } from "@/lib/api";

export const TICKET_STATUS: Record<string, [Tone, string]> = {
  open: ["amber", "Waiting for support"],
  pending: ["blue", "Waiting for you"],
  resolved: ["green", "Resolved"],
  closed: ["gray", "Closed"],
};

export const CATEGORY_LABEL: Record<Ticket["category"], string> = {
  billing: "Billing & payments",
  licence: "Licence & EA",
  account: "My account",
  technical: "Technical help",
  other: "Something else",
};

export function TicketStatus({ status, staffView = false }: { status: string; staffView?: boolean }) {
  const [tone, label] = TICKET_STATUS[status] ?? ["gray", status];
  const staffLabel: Record<string, string> = { open: "Needs reply", pending: "Awaiting customer" };
  return <Chip tone={tone}>{staffView ? staffLabel[status] ?? label : label}</Chip>;
}

/** Chat-style message thread with a reply box. */
export function Thread({
  ticket,
  onReply,
  staff = false,
}: {
  ticket: TicketDetail;
  onReply: (body: string, internal: boolean) => Promise<void>;
  staff?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internal, setInternal] = useState(false);
  const closed = ticket.status === "closed" && !staff;

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim();
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      await onReply(body, internal);
      form.reset();
      setInternal(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-4">
        {ticket.messages.map((m) => {
          const mine = staff ? m.staff : !m.staff;
          return (
            <li key={m.id} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${m.staff ? "bg-brand/15 text-brand-light" : "bg-fg/[0.06] text-ink-300"}`}>
                {m.staff ? <Headset className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
              </span>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                m.internal ? "border border-dashed border-amber/40 bg-amber/[0.07]" : mine ? "bg-brand/15" : "border border-fg/[0.06] bg-fg/[0.03]"
              }`}>
                <p className="mb-1 text-xs text-ink-400">
                  <b className="text-ink-200">{m.author}</b> · {ago(m.created_at)}
                  {m.internal && <span className="ml-2 font-semibold text-amber">internal note</span>}
                </p>
                <p className="leading-relaxed whitespace-pre-wrap">{m.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {closed ? (
        <p className="rounded-xl border border-fg/[0.06] bg-fg/[0.02] p-4 text-center text-sm text-ink-300">This ticket is closed. Open a new one if you need more help.</p>
      ) : (
        <form onSubmit={send} className="card p-4">
          <textarea name="body" rows={4} required maxLength={5000} className="input resize-y" placeholder={internal ? "Internal note — only staff can see this" : "Write a reply…"} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {staff ? (
              <label className="flex items-center gap-2 text-sm text-ink-300">
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="accent-amber" /> Internal note
              </label>
            ) : (
              <span />
            )}
            <button className="btn-primary" disabled={busy}>
              {busy ? <Spinner /> : <Send className="h-4 w-4" />} {internal ? "Add note" : "Send reply"}
            </button>
          </div>
          <div className="mt-2">
            <ErrorNote message={error} />
          </div>
        </form>
      )}
    </div>
  );
}
