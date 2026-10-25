"use client";

import { ArrowLeft, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

import { Markdown } from "@/components/Markdown";
import { Reveal } from "@/components/motion";
import { EmptyState, Loading } from "@/components/ui";
import { ARTICLE_CATEGORIES, fetcher, post, shortDate, type ArticleDetail } from "@/lib/api";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, error } = useSWR<ArticleDetail>(`/help/articles/${slug}`, fetcher, { revalidateOnFocus: false });
  const [voted, setVoted] = useState<boolean | null>(null);

  if (error) return <div className="py-20"><EmptyState icon={ArrowLeft} title="Article not found" action={<Link href="/help" className="btn-primary">Back to the help centre</Link>} /></div>;
  if (!data) return <div className="py-20"><Loading /></div>;

  return (
    <div className="mx-auto max-w-3xl py-12 sm:py-16">
      <Link href="/help" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100">
        <ArrowLeft className="h-4 w-4" /> Help centre
      </Link>
      <Reveal>
        <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-brand-light uppercase">{ARTICLE_CATEGORIES[data.category]}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{data.title}</h1>
        {data.summary && <p className="mt-3 text-lg text-ink-300">{data.summary}</p>}
        <p className="mt-3 text-xs text-ink-400">Updated {shortDate(data.updated_at)}</p>
      </Reveal>
      <Reveal delay={0.08}>
        <article className="card mt-8 p-6 sm:p-8">
          <Markdown source={data.body} />
        </article>
      </Reveal>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-ink-300">
        {voted === null ? (
          <>
            <span>Was this helpful?</span>
            {[true, false].map((helpful) => (
              <button
                key={String(helpful)}
                className="btn-ghost px-3 py-1.5"
                onClick={() => {
                  setVoted(helpful);
                  post(`/help/articles/${slug}/feedback`, { helpful }).catch(() => undefined);
                }}
              >
                {helpful ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />} {helpful ? "Yes" : "No"}
              </button>
            ))}
          </>
        ) : voted ? (
          <span className="text-ok">Thanks for the feedback!</span>
        ) : (
          <span>
            Sorry about that. <Link href="/dashboard/support" className="font-medium text-brand-light hover:underline">Ask our team</Link> and we&apos;ll help.
          </span>
        )}
      </div>

      {data.related.length > 0 && (
        <div className="mt-12">
          <p className="text-sm font-semibold">Related articles</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {data.related.map((a) => (
              <li key={a.slug}>
                <Link href={`/help/${a.slug}`} className="card block h-full p-4 text-sm transition hover:border-brand/30">
                  <span className="font-medium text-ink-100">{a.title}</span>
                  {a.summary && <span className="mt-1 block text-xs text-ink-400">{a.summary}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
