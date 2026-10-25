"use client";

import { BookOpen, Eye, ExternalLink, FilePlus2, Pencil, Save, Search, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import useSWR from "swr";

import { Markdown } from "@/components/Markdown";
import { Chip, EmptyState, ErrorNote, Loading, PageHeader, Section, Spinner } from "@/components/ui";
import { ARTICLE_CATEGORIES, ago, del, fetcher, post, put, type AdminArticle, type ArticleCategory } from "@/lib/api";

export default function KnowledgeBasePage() {
  const [q, setQ] = useState("");
  const { data, mutate } = useSWR<AdminArticle[]>(`/admin/kb${q ? `?q=${encodeURIComponent(q)}` : ""}`, fetcher, { keepPreviousData: true });
  const [editing, setEditing] = useState<AdminArticle | "new" | null>(null);

  if (editing) {
    return <Editor article={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => (setEditing(null), mutate())} />;
  }

  return (
    <>
      <PageHeader
        title="Help articles"
        description="Guides in the public help centre. They're also suggested to customers while they write a ticket."
        actions={
          <>
            <Link href="/help" target="_blank" className="btn-ghost">
              <ExternalLink className="h-4 w-4" /> Open help centre
            </Link>
            <button className="btn-primary" onClick={() => setEditing("new")}>
              <FilePlus2 className="h-4 w-4" /> New article
            </button>
          </>
        }
      />
      <label className="relative mb-4 block">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input className="input pl-9" placeholder="Search articles" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <Section>
        {!data ? (
          <Loading />
        ) : data.length === 0 ? (
          <EmptyState icon={BookOpen} title="No articles" />
        ) : (
          <ul className="-my-2 divide-y divide-fg/[0.05]">
            {data.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {a.title} {!a.published && <Chip tone="gray">draft</Chip>}
                  </p>
                  <p className="text-xs text-ink-400">
                    {ARTICLE_CATEGORIES[a.category]} · /help/{a.slug} · updated {ago(a.updated_at)}
                  </p>
                </div>
                <span className="flex items-center gap-3 text-xs text-ink-400">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {a.views}</span>
                  <span className="flex items-center gap-1 text-ok"><ThumbsUp className="h-3.5 w-3.5" /> {a.helpful_yes}</span>
                  <span className="flex items-center gap-1 text-loss"><ThumbsDown className="h-3.5 w-3.5" /> {a.helpful_no}</span>
                </span>
                <button className="btn-ghost px-3 py-1.5 text-sm" onClick={() => setEditing(a)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function Editor({ article, onClose, onSaved }: { article: AdminArticle | null; onClose: () => void; onSaved: () => void }) {
  const [body, setBody] = useState(article?.body ?? "## \n\n");
  const [title, setTitle] = useState(article?.title ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      title,
      slug: String(fd.get("slug") || "") || null,
      summary: String(fd.get("summary") ?? ""),
      body,
      category: fd.get("category") as ArticleCategory,
      published: fd.get("published") === "on",
      sort_order: Number(fd.get("sort_order") || 0),
    };
    setBusy(true);
    setError(null);
    try {
      await (article ? put(`/admin/kb/${article.id}`, data) : post("/admin/kb", data));
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={article ? "Edit article" : "New article"}
        actions={
          <button className="btn-ghost" onClick={onClose}>
            <X className="h-4 w-4" /> Close
          </button>
        }
      />
      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <Section title="Content">
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="k-title">Title</label>
              <input id="k-title" className="input" required minLength={3} maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="k-cat">Topic</label>
                <select id="k-cat" name="category" className="input" defaultValue={article?.category ?? "getting-started"}>
                  {Object.entries(ARTICLE_CATEGORIES).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="k-slug">Address</label>
                <input id="k-slug" name="slug" className="input num" defaultValue={article?.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} placeholder="made from the title" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="k-summary">Summary</label>
              <input id="k-summary" name="summary" className="input" maxLength={280} defaultValue={article?.summary} placeholder="One line shown in lists and search" />
            </div>
            <div>
              <label className="label" htmlFor="k-body">Article</label>
              <textarea id="k-body" rows={18} className="input num resize-y text-sm leading-relaxed" required value={body} onChange={(e) => setBody(e.target.value)} />
              <p className="mt-1.5 text-xs text-ink-400">
                Markdown: <code>## Heading</code>, <code>**bold**</code>, <code>*italic*</code>, <code>`code`</code>, <code>- list</code>, <code>1. steps</code>, <code>[link](/dashboard)</code>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="published" defaultChecked={article?.published ?? false} className="accent-brand" /> Published
              </label>
              <label className="flex items-center gap-2">
                Order <input name="sort_order" type="number" min={0} className="input num w-20 py-1" defaultValue={article?.sort_order ?? 0} />
              </label>
            </div>
            <ErrorNote message={error} />
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" disabled={busy}>
                {busy ? <Spinner /> : <Save className="h-4 w-4" />} Save article
              </button>
              {article && (
                <button
                  type="button"
                  className="btn-ghost text-loss"
                  onClick={async () => {
                    if (!window.confirm(`Delete "${article.title}"?`)) return;
                    await del(`/admin/kb/${article.id}`);
                    onSaved();
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              )}
            </div>
          </div>
        </Section>
        <Section title="Preview">
          <h1 className="mb-4 text-2xl font-bold tracking-tight">{title || "Untitled"}</h1>
          <Markdown source={body} />
        </Section>
      </form>
    </>
  );
}
