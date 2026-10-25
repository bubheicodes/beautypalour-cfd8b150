"use client";

import { Globe2, MailCheck, Save, Search, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { Chip, ErrorNote, Loading, PageHeader, Section, Spinner } from "@/components/ui";
import { can, fetcher, put, type AccountRules, type Countries } from "@/lib/api";
import { countryName, countryOptions, flag } from "@/lib/countries";
import { useMe } from "@/lib/hooks";

export default function CountriesPage() {
  const { user } = useMe();
  const { data, mutate } = useSWR<Countries>("/admin/settings/countries", fetcher);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const all = useMemo(() => countryOptions(), []);

  useEffect(() => {
    if (data) {
      setBlocked(data.blocked);
      setMessage(data.message);
    }
  }, [data]);
  if (!data || !user) return <Loading />;
  const editable = can(user, "settings");
  const matches = all.filter((c) => !blocked.includes(c.code) && (c.name.toLowerCase().includes(q.toLowerCase()) || c.code === q.toUpperCase()));

  async function save() {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await mutate(await put<Countries>("/admin/settings/countries", { blocked, message }));
      setMsg("Saved — applies to new sign-ups and purchases immediately.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Access rules" description="Who can sign up and buy, and what every account must do." />
      <AccountRulesCard editable={editable} />
      <h2 className="mt-8 mb-1 text-lg font-semibold">Country restrictions</h2>
      <p className="mb-4 text-sm text-ink-300">Visitors from these countries can&apos;t create an account or buy. Existing subscribers keep their licence.</p>
      {!data.geoip && (
        <p className="mb-4 rounded-xl border border-amber/25 bg-amber/10 p-3 text-sm text-amber">
          IP lookup isn&apos;t available on this server, so only the country customers declare at sign-up is checked.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Section title={`Blocked (${blocked.length})`} description="Matched against the declared country and the visitor's IP address.">
          {blocked.length === 0 ? (
            <p className="text-sm text-ink-400">No countries blocked — TradePilot is available everywhere.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {blocked.map((code) => (
                <span key={code} className="inline-flex items-center gap-1.5 rounded-full border border-loss/25 bg-loss/10 py-1 pr-1 pl-3 text-sm">
                  {flag(code)} {countryName(code)}
                  {editable && (
                    <button onClick={() => setBlocked(blocked.filter((c) => c !== code))} className="grid h-5 w-5 place-items-center rounded-full hover:bg-loss/20" aria-label={`Unblock ${countryName(code)}`}>
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
          <div className="mt-5">
            <label className="label" htmlFor="c-msg">Message shown to blocked visitors</label>
            <input id="c-msg" className="input" value={message} maxLength={200} disabled={!editable} onChange={(e) => setMessage(e.target.value)} />
          </div>
          {editable && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button className="btn-primary" onClick={save} disabled={busy}>
                {busy ? <Spinner /> : <Save className="h-4 w-4" />} Save
              </button>
              {msg && <span className="text-sm text-ok">{msg}</span>}
              <ErrorNote message={error} />
            </div>
          )}
        </Section>
        {editable && (
          <Section title="Add countries">
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input className="input pl-9" placeholder="Search countries" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <ul className="mt-3 max-h-96 divide-y divide-fg/[0.04] overflow-y-auto pr-1">
              {matches.map((c) => (
                <li key={c.code} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {flag(c.code)} {c.name} <span className="num text-xs text-ink-400">{c.code}</span>
                  </span>
                  <button className="text-xs font-medium text-loss hover:underline" onClick={() => setBlocked([...blocked, c.code].sort())}>
                    Block
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        )}
        {!editable && (
          <Section>
            <Chip tone="gray">
              <Globe2 className="h-3.5 w-3.5" /> View only — admins change this list
            </Chip>
          </Section>
        )}
      </div>
    </>
  );
}

function AccountRulesCard({ editable }: { editable: boolean }) {
  const { data, mutate } = useSWR<AccountRules>("/admin/settings/accounts", fetcher);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!data) return null;

  async function toggle(require_email_verification: boolean) {
    setBusy(true);
    setError(null);
    try {
      await mutate(await put<AccountRules>("/admin/settings/accounts", { require_email_verification }), { revalidate: false });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Account rules">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-fg/[0.06] p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 accent-brand"
              checked={data.require_email_verification}
              disabled={!editable || busy}
              onChange={(e) => toggle(e.target.checked)}
            />
            <span>
              <span className="flex items-center gap-2 font-medium">
                <MailCheck className="h-4 w-4 text-brand-light" /> Confirmed email before buying
              </span>
              <span className="mt-1 block text-sm text-ink-400">New customers confirm their email address (link sent at sign-up) before they can place an order.</span>
            </span>
          </label>
          {data.require_email_verification && !data.email_sending && (
            <p className="mt-3 rounded-lg bg-amber/10 p-2.5 text-xs text-amber">
              Not enforced yet: email sending (SMTP) isn&apos;t set up on the server, so nobody could receive the link. It switches on by itself once SMTP is configured.
            </p>
          )}
        </div>
        <div className="rounded-xl border border-fg/[0.06] p-4">
          <p className="flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4 text-brand-light" /> Two-factor login for staff
            <Chip tone={data.staff_require_2fa ? "green" : "amber"}>{data.staff_require_2fa ? "Required" : "Optional"}</Chip>
          </p>
          <p className="mt-1 text-sm text-ink-400">
            Admin, management and support accounts must use an authenticator app to open the staff panel. Customers can turn it on from their account page.
          </p>
          <p className="mt-2 text-xs text-ink-400">Set on the server (STAFF_REQUIRE_2FA).</p>
        </div>
      </div>
      <ErrorNote message={error} />
    </Section>
  );
}
