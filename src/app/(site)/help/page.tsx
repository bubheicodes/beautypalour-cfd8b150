"use client";

import { BookOpen, ChevronRight, CreditCard, KeyRound, LifeBuoy, Rocket, Search, ShieldCheck, Wrench, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { EmptyState, Loading } from "@/components/ui";
import { ARTICLE_CATEGORIES, fetcher, type Article, type ArticleCategory } from "@/lib/api";

const ICON: Record<ArticleCategory, LucideIcon> = {
  "getting-started": Rocket,
  installation: BookOpen,
  billing: CreditCard,
  licence: KeyRound,
  troubleshooting: Wrench,
  account: ShieldCheck,
};

export default function HelpPage() {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<ArticleCategory | "">("");
  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 250);
    return () => clearTimeout(t);
  }, [text]);
  const qs = new URLSearchParams({ ...(q && { q }), ...(category && { category }) }).toString();
  const { data } = useSWR<Article[]>(`/help/articles${qs ? `?${qs}` : ""}`, fetcher, { keepPreviousData: true });
  const searching = !!q || !!category;

  return (
    <div className="py-12 sm:py-16">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold tracking-[0.25em] text-brand-light uppercase">Help centre</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">How can we help?</h1>
        <p className="mt-3 text-ink-300">Step-by-step guides for installing, licensing and paying for TradePilot EA.</p>
        <label className="relative mt-8 block">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-ink-400" />
          <input
            className="input h-14 rounded-2xl pl-12 text-base"
            placeholder="Search, e.g. “licence not active”"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Search the help centre"
          />
        </label>
      </Reveal>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <button onClick={() => setCategory("")} className={`rounded-full border px-3.5 py-1.5 text-sm transition ${!category ? "border-brand/40 bg-brand/15 text-ink-100" : "border-fg/[0.08] text-ink-300 hover:text-ink-100"}`}>
          All topics
        </button>
        {(Object.keys(ARTICLE_CATEGORIES) as ArticleCategory[]).map((c) => {
          const I = ICON[c];
          return (
            <button
              key={c}
              onClick={() => setCategory(category === c ? "" : c)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${category === c ? "border-brand/40 bg-brand/15 text-ink-100" : "border-fg/[0.08] text-ink-300 hover:text-ink-100"}`}
            >
              <I className="h-3.5 w-3.5" /> {ARTICLE_CATEGORIES[c]}
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        {!data ? (
          <Loading />
        ) : data.length === 0 ? (
          <EmptyState icon={Search} title={searching ? "No articles match" : "No articles yet"} body="Try other words, or ask our team directly." action={<Link href="/dashboard/support" className="btn-primary">Contact support</Link>} />
        ) : (
          <Stagger className="grid gap-3 sm:grid-cols-2">
            {data.map((a) => {
              const I = ICON[a.category];
              return (
                <StaggerItem key={a.slug}>
                  <Link href={`/help/${a.slug}`} className="card group flex h-full items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:border-brand/30">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand-light">
                      <I className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-xs text-ink-400">{ARTICLE_CATEGORIES[a.category]}</span>
                      <span className="mt-0.5 block font-semibold text-ink-100 group-hover:text-brand-light">{a.title}</span>
                      {a.summary && <span className="mt-1 block text-sm text-ink-400">{a.summary}</span>}
                    </span>
                    <ChevronRight className="mt-6 h-4 w-4 shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-brand-light" />
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </div>

      <Reveal className="mx-auto mt-14 max-w-3xl">
        <div className="card flex flex-wrap items-center gap-4 p-6">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand-light">
            <LifeBuoy className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Still stuck?</p>
            <p className="text-sm text-ink-400">Open a ticket and our team will get back to you, usually within a few hours.</p>
          </div>
          <Link href="/dashboard/support" className="btn-primary">Contact support</Link>
        </div>
      </Reveal>
    </div>
  );
}
