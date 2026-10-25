"use client";

import { ArrowUpRight, BookOpen, LifeBuoy, MessageSquarePlus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import useSWR from "swr";

import { Stagger, StaggerItem } from "@/components/motion";
import { CATEGORY_LABEL, TicketStatus } from "@/components/tickets";
import { ErrorNote, Loading, PageHeader, Section, Spinner } from "@/components/ui";
import { ago, fetcher, post, type Article, type Ticket, type TicketDetail } from "@/lib/api";

export default function SupportPage() {
  const { data } = useSWR<Ticket[]>("/me/tickets", fetcher);
  const [composing, setComposing] = useState(false);
  if (!data) return <Loading />;

  return (
    <>
      <PageHeader
        title="Support"
        description="Questions about payments, your licence or the EA? Our team usually replies within a few hours."
        actions={
          <button className="btn-primary" onClick={() => setComposing(true)}>
            <MessageSquarePlus className="h-4 w-4" /> New ticket
          </button>
        }
      />
      {(composing || data.length === 0) && <NewTicket onCancel={data.length ? () => setComposing(false) : undefined} />}
      {data.length > 0 && (
        <Section title="Your tickets" className="mt-6">
          <Stagger className="divide-y divide-fg/[0.05]">
            {data.map((t) => (
              <StaggerItem key={t.id}>
                <Link href={`/dashboard/support/${t.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3.5 transition hover:opacity-80">
                  <span className="min-w-0">
                    <span className="num mr-2 text-xs text-ink-400">#{t.number}</span>
                    <span className="font-medium">{t.subject}</span>
                    <span className="block text-xs text-ink-400">
                      {CATEGORY_LABEL[t.category]} · updated {ago(t.updated_at)}
                    </span>
                  </span>
                  <TicketStatus status={t.status} />
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      )}
    </>
  );
}

function NewTicket({ onCancel }: { onCancel?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(subject.trim()), 350);
    return () => clearTimeout(t);
  }, [subject]);
  const { data: suggestions } = useSWR<Article[]>(q.length >= 3 ? `/help/suggest?q=${encodeURIComponent(q)}` : null, fetcher, { keepPreviousData: true });

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const t = await post<TicketDetail>("/me/tickets", {
        subject: fd.get("subject"),
        category: fd.get("category"),
        body: fd.get("body"),
        order_code: fd.get("order_code") || undefined,
      });
      router.push(`/dashboard/support/${t.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Section title="How can we help?" description="Tell us what's happening — include your MT5 login or order code if it's about a licence or payment.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr_0.8fr]">
          <div>
            <label className="label" htmlFor="t-subject">Subject</label>
            <input
              id="t-subject"
              name="subject"
              className="input"
              required
              minLength={3}
              maxLength={160}
              placeholder="e.g. EA shows NOT LICENSED"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="t-cat">Topic</label>
            <select id="t-cat" name="category" className="input" defaultValue="licence">
              {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="t-order">Order (optional)</label>
            <input id="t-order" name="order_code" className="input num" placeholder="TP-XXXXX" maxLength={16} />
          </div>
        </div>
        <AnimatePresence>
          {q.length >= 3 && !!suggestions?.length && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="rounded-xl border border-brand/20 bg-brand/[0.06] p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-ink-100">
                  <BookOpen className="h-4 w-4 text-brand-light" /> These guides might answer it straight away
                </p>
                <ul className="mt-2 space-y-1.5">
                  {suggestions.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/help/${a.slug}`} target="_blank" className="group flex items-start gap-2 text-sm">
                        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-light" />
                        <span>
                          <span className="font-medium text-brand-light group-hover:underline">{a.title}</span>
                          {a.summary && <span className="block text-xs text-ink-400">{a.summary}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div>
          <label className="label" htmlFor="t-body">Message</label>
          <textarea id="t-body" name="body" rows={5} required minLength={5} maxLength={5000} className="input resize-y" />
        </div>
        <ErrorNote message={error} />
        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy}>
            {busy ? <Spinner /> : <LifeBuoy className="h-4 w-4" />} Send to support
          </button>
          {onCancel && (
            <button type="button" className="btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </Section>
  );
}

