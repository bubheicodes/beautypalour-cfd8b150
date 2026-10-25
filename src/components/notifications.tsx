"use client";

import { Bell, CheckCheck, CircleAlert, CircleCheck, Info, Megaphone, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

import { ago, fetcher, post, type Banner, type Inbox, type InboxItem } from "@/lib/api";

const KIND: Record<InboxItem["kind"], { icon: LucideIcon; tone: string }> = {
  info: { icon: Info, tone: "text-brand-light bg-brand/10" },
  success: { icon: CircleCheck, tone: "text-ok bg-ok/10" },
  warning: { icon: TriangleAlert, tone: "text-amber bg-amber/10" },
  danger: { icon: CircleAlert, tone: "text-loss bg-loss/10" },
};

/** Bell in the top bar with the in-app notifications (polled every 30 s). */
export function InboxBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data, mutate } = useSWR<Inbox>("/me/inbox?limit=15", fetcher, { refreshInterval: 30000 });
  const unread = data?.unread ?? 0;

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function markRead(ids?: number[]) {
    if (!data) return;
    const now = new Date().toISOString();
    mutate(
      {
        unread: ids ? Math.max(0, data.unread - data.items.filter((i) => ids.includes(i.id) && !i.read_at).length) : 0,
        items: data.items.map((i) => (!ids || ids.includes(i.id) ? { ...i, read_at: i.read_at ?? now } : i)),
      },
      { revalidate: false },
    );
    await post("/me/inbox/read", ids ? { ids } : {}).catch(() => mutate());
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-xl text-ink-300 transition hover:bg-fg/[0.05] hover:text-ink-100"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="h-4.5 w-4.5" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="num absolute -top-0.5 -right-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-loss px-1 text-[0.6rem] font-bold text-white"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="card absolute top-12 right-0 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden p-0 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-fg/[0.06] px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && (
                <button onClick={() => markRead()} className="flex items-center gap-1.5 text-xs text-brand-light hover:underline">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-[26rem] divide-y divide-fg/[0.05] overflow-y-auto">
              {!data?.items.length ? (
                <li className="px-4 py-10 text-center text-sm text-ink-400">You&apos;re all caught up.</li>
              ) : (
                data.items.map((item) => {
                  const k = KIND[item.kind];
                  return (
                    <li key={item.id}>
                      <button
                        className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-fg/[0.03] ${item.read_at ? "opacity-70" : ""}`}
                        onClick={() => {
                          if (!item.read_at) markRead([item.id]);
                          if (item.link) {
                            setOpen(false);
                            router.push(item.link);
                          }
                        }}
                      >
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${k.tone}`}>
                          <k.icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start gap-2">
                            <span className="flex-1 text-sm font-medium text-ink-100">{item.title}</span>
                            {!item.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                          </span>
                          {item.body && <span className="mt-0.5 line-clamp-2 block text-xs text-ink-400">{item.body}</span>}
                          <span className="mt-1 block text-[0.7rem] text-ink-400">{ago(item.created_at)}</span>
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const BANNER_TONE: Record<Banner["level"], string> = {
  info: "border-brand/25 bg-brand/10 text-brand-light",
  success: "border-ok/25 bg-ok/10 text-ok",
  warning: "border-amber/25 bg-amber/10 text-amber",
};

const DISMISSED = "tp_dismissed_banners";

function readDismissed(): number[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED) ?? "[]");
  } catch {
    return [];
  }
}

/** Live announcements from the admin. Dismissing one is remembered in this browser. */
export function Banners({ source }: { source: "/me/announcements" | "/announcements" }) {
  const { data } = useSWR<Banner[]>(source, fetcher, { refreshInterval: 120000, shouldRetryOnError: false });
  const [dismissed, setDismissed] = useState<number[] | null>(null);
  useEffect(() => setDismissed(readDismissed()), []);
  const shown = (data ?? []).filter((b) => dismissed && !dismissed.includes(b.id));

  return (
    <AnimatePresence initial={false}>
      {shown.map((b) => (
        <motion.div
          key={b.id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className={`mb-3 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${BANNER_TONE[b.level]}`}>
            <Megaphone className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink-100">{b.title}</p>
              {b.body && <p className="mt-0.5 whitespace-pre-line text-ink-300">{b.body}</p>}
              {b.link &&
                (b.link.startsWith("/") ? (
                  <Link href={b.link} className="mt-1 inline-block font-medium hover:underline">
                    Learn more →
                  </Link>
                ) : (
                  <a href={b.link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-medium hover:underline">
                    Learn more →
                  </a>
                ))}
            </div>
            <button
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-ink-400 hover:bg-fg/[0.06] hover:text-ink-100"
              aria-label="Dismiss"
              onClick={() => {
                const next = [...readDismissed(), b.id].slice(-50);
                try {
                  localStorage.setItem(DISMISSED, JSON.stringify(next));
                } catch {
                  // storage unavailable: dismissed for this page view only
                }
                setDismissed(next);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
