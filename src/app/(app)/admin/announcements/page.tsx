"use client";

import { Bell, Mail, Megaphone, Send, Trash2, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import useSWR from "swr";

import { Stagger, StaggerItem } from "@/components/motion";
import { Chip, EmptyState, ErrorNote, Loading, PageHeader, Section, Spinner } from "@/components/ui";
import { ago, can, del, fetcher, patch, post, shortDate, type Announcement, type Audience } from "@/lib/api";
import { useMe } from "@/lib/hooks";

const AUDIENCES: Record<Audience, { label: string; hint: string }> = {
  customers: { label: "All customers", hint: "Every customer account" },
  active: { label: "Active subscribers", hint: "Customers with a licence running now" },
  inactive: { label: "No active licence", hint: "Expired or never bought — good for win-backs" },
  everyone: { label: "Everyone", hint: "All accounts, and a banner on the public site" },
  staff: { label: "Staff only", hint: "Admin, management and support" },
};

const LEVEL_TONE = { info: "blue", success: "green", warning: "amber" } as const;

export default function AnnouncementsPage() {
  const { user } = useMe();
  const { data, mutate } = useSWR<Announcement[]>("/admin/announcements", fetcher);
  const { data: sizes } = useSWR<Record<Audience, number>>("/admin/announcements/audience", fetcher);
  if (!data || !user) return <Loading />;
  const editable = can(user, "announce");

  return (
    <>
      <PageHeader title="Announcements" description="Tell customers about updates, maintenance or offers — as a banner, an in-app notification and an email." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] [&>*]:min-w-0">
        {editable && <Compose sizes={sizes} onSent={() => mutate()} />}
        <Section title="Sent" className={editable ? "" : "lg:col-span-2"}>
          {data.length === 0 ? (
            <EmptyState icon={Megaphone} title="Nothing sent yet" />
          ) : (
            <Stagger className="space-y-3">
              {data.map((a) => (
                <StaggerItem key={a.id}>
                  <div className="rounded-xl border border-fg/[0.06] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold">{a.title}</p>
                      <span className="flex gap-1.5">
                        <Chip tone={LEVEL_TONE[a.level]}>{a.level}</Chip>
                        {a.live ? <Chip tone="green">banner live</Chip> : a.banner ? <Chip tone="gray">banner ended</Chip> : null}
                      </span>
                    </div>
                    {a.body && <p className="mt-1 line-clamp-3 text-sm whitespace-pre-line text-ink-400">{a.body}</p>}
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {AUDIENCES[a.audience].label} · {a.recipients}</span>
                      {a.sent_inbox && <span className="flex items-center gap-1"><Bell className="h-3.5 w-3.5" /> in-app</span>}
                      {a.sent_email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> email</span>}
                      <span>{a.author ? `${a.author} · ` : ""}{ago(a.created_at)}</span>
                      {a.ends_at && <span>banner until {shortDate(a.ends_at)}</span>}
                    </p>
                    {editable && (
                      <div className="mt-3 flex gap-2">
                        {a.live && (
                          <button className="btn-ghost px-3 py-1.5 text-xs" onClick={async () => (await patch(`/admin/announcements/${a.id}`, { banner: false }), mutate())}>
                            End banner
                          </button>
                        )}
                        <button
                          className="btn-ghost px-3 py-1.5 text-xs text-loss"
                          onClick={async () => {
                            if (!window.confirm("Delete this announcement? Notifications already sent stay in people's inboxes.")) return;
                            await del(`/admin/announcements/${a.id}`);
                            mutate();
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </Section>
      </div>
    </>
  );
}

function Compose({ sizes, onSent }: { sizes?: Record<Audience, number>; onSent: () => void }) {
  const [audience, setAudience] = useState<Audience>("customers");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [level, setLevel] = useState<"info" | "success" | "warning">("info");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = fd.get("send_email") === "on";
    const count = sizes?.[audience] ?? 0;
    if (email && !window.confirm(`Email ${count} ${count === 1 ? "person" : "people"}? This can't be unsent.`)) return;
    setBusy(true);
    setError(null);
    setSent(null);
    try {
      const a = await post<Announcement>("/admin/announcements", {
        title,
        body,
        level,
        audience,
        link: fd.get("link") || null,
        banner: fd.get("banner") === "on",
        send_inbox: fd.get("send_inbox") === "on",
        send_email: email,
        ends_at: fd.get("ends_at") ? new Date(String(fd.get("ends_at"))).toISOString() : null,
      });
      setSent(`Sent to ${a.recipients} ${a.recipients === 1 ? "person" : "people"}.`);
      setTitle("");
      setBody("");
      form.reset();
      onSent();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="New announcement">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <p className="label">Audience</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(AUDIENCES) as Audience[]).map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => setAudience(a)}
                className={`rounded-xl border p-3 text-left text-sm transition ${audience === a ? "border-brand/50 bg-brand/10" : "border-fg/[0.06] hover:border-fg/[0.12]"}`}
              >
                <span className="flex items-center justify-between font-medium">
                  {AUDIENCES[a].label} <span className="num text-xs text-ink-400">{sizes?.[a] ?? "…"}</span>
                </span>
                <span className="mt-0.5 block text-xs text-ink-400">{AUDIENCES[a].hint}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="an-title">Title</label>
          <input id="an-title" className="input" required minLength={3} maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="EA update v2.1 is available" />
        </div>
        <div>
          <label className="label" htmlFor="an-body">Message</label>
          <textarea id="an-body" rows={4} maxLength={2000} className="input resize-y" value={body} onChange={(e) => setBody(e.target.value)} placeholder="What changed and what customers should do." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="an-link">Link (optional)</label>
            <input id="an-link" name="link" className="input" maxLength={300} pattern="(/|https://).*" placeholder="/dashboard/ea or https://…" />
          </div>
          <div>
            <label className="label" htmlFor="an-level">Style</label>
            <select id="an-level" className="input" value={level} onChange={(e) => setLevel(e.target.value as typeof level)}>
              <option value="info">Information</option>
              <option value="success">Good news</option>
              <option value="warning">Warning</option>
            </select>
          </div>
        </div>
        <fieldset className="space-y-2 rounded-xl border border-fg/[0.06] p-4 text-sm">
          <legend className="px-1 text-xs text-ink-400">Deliver as</legend>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="banner" defaultChecked className="accent-brand" /> <Megaphone className="h-4 w-4 text-ink-400" /> Banner in the app
            {audience === "everyone" && " and on the website"}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="send_inbox" defaultChecked className="accent-brand" /> <Bell className="h-4 w-4 text-ink-400" /> In-app notification
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="send_email" className="accent-brand" /> <Mail className="h-4 w-4 text-ink-400" /> Email
          </label>
          <div className="pt-1">
            <label className="label" htmlFor="an-ends">Banner ends (optional)</label>
            <input id="an-ends" name="ends_at" type="datetime-local" className="input" />
          </div>
        </fieldset>
        {title && (
          <div>
            <p className="label">Preview</p>
            <div className={`rounded-2xl border px-4 py-3 text-sm ${level === "warning" ? "border-amber/25 bg-amber/10" : level === "success" ? "border-ok/25 bg-ok/10" : "border-brand/25 bg-brand/10"}`}>
              <p className="font-semibold text-ink-100">{title}</p>
              {body && <p className="mt-0.5 whitespace-pre-line text-ink-300">{body}</p>}
            </div>
          </div>
        )}
        <ErrorNote message={error} />
        {sent && <p className="text-sm text-ok">{sent}</p>}
        <button className="btn-primary" disabled={busy}>
          {busy ? <Spinner /> : <Send className="h-4 w-4" />} Send announcement
        </button>
      </form>
    </Section>
  );
}
