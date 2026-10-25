"use client";

import { ArrowUpRight, Check, Copy, Gift, Hourglass, Network, Users, Wallet } from "lucide-react";
import { useState, type FormEvent } from "react";
import useSWR from "swr";

import { EmptyState, ErrorNote, Loading, PageHeader, Section, Spinner, StatCard, StatusChip } from "@/components/ui";
import { fetcher, post, shortDate, usd, type ReferralSummary, type Withdrawal, type WithdrawalsSummary } from "@/lib/api";
import { useMe } from "@/lib/hooks";

export default function ReferralsPage() {
  const { data } = useSWR<ReferralSummary>("/me/referrals", fetcher);
  const { data: w, mutate } = useSWR<WithdrawalsSummary>("/me/withdrawals", fetcher, {
    refreshInterval: (d) => (d?.withdrawals.some((x) => ["pending", "awaiting_2fa", "processing"].includes(x.status)) ? 10000 : 0),
  });
  const [copied, setCopied] = useState(false);
  if (!data || !w) return <Loading />;

  const link = `${typeof window === "undefined" ? "" : window.location.origin}/register?ref=${data.code}`;
  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <PageHeader title="Referrals" description="Invite traders to TradePilot and earn USDT you can withdraw." />

      <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-deep/25 via-ink-900 to-ink-900 p-6 sm:p-7">
        <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-brand/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <h2 className="text-lg font-semibold">Your referral link</h2>
            <p className="mt-1 text-sm text-ink-300">
              Earn <b className="text-ink-100">{Number(data.tier1_percent)}%</b> of a new trader&apos;s <b className="text-ink-100">first payment</b> and{" "}
              <b className="text-ink-100">{Number(data.tier1_repeat_percent)}%</b> every time they resubscribe — plus{" "}
              <b className="text-ink-100">{Number(data.tier2_percent)}%</b> of the first payment of traders <i>they</i> invite.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input readOnly value={link} className="input num" onFocus={(e) => e.currentTarget.select()} aria-label="Your referral link" />
              <button className="btn-primary shrink-0" onClick={copy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>
          <ol className="grid grid-cols-3 gap-2 text-center text-xs text-ink-300">
            {["Share your link", "They sign up & pay", "You earn USDT"].map((t, i) => (
              <li key={t} className="rounded-xl border border-fg/[0.06] bg-ink-950/40 p-3">
                <span className="num mx-auto grid h-7 w-7 place-items-center rounded-full bg-brand/15 text-brand-light">{i + 1}</span>
                <p className="mt-2">{t}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Invited by you" value={data.tier1_count} hint="tier 1" />
        <StatCard icon={Network} label="Invited by them" value={data.tier2_count} hint="tier 2" />
        <StatCard icon={Gift} label="Total earned" value={usd(data.earned_usd)} hint="all tiers" tone="green" />
        <StatCard icon={Wallet} label="Withdrawable now" value={usd(w.available)} hint={Number(w.maturing) > 0 ? `${usd(w.maturing)} available soon` : `min. ${usd(w.min_withdrawal)}`} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr] [&>*]:min-w-0">
        <WithdrawForm summary={w} onDone={() => mutate()} />
        <Section title="Withdrawals">
          {w.withdrawals.length === 0 ? (
            <EmptyState icon={ArrowUpRight} title="No withdrawals yet" body="Approved withdrawals are sent in USDT to your wallet." />
          ) : (
            <ul className="space-y-2">
              {w.withdrawals.map((x) => (
                <WithdrawalRow key={x.id} w={x} />
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Recent rewards" className="mt-6">
        {data.rewards.length === 0 ? (
          <EmptyState icon={Gift} title="No rewards yet" body="When someone you invite makes their first payment, your reward shows here." />
        ) : (
          <ul className="divide-y divide-fg/[0.05]">
            {data.rewards.map((r, i) => (
              <li key={`${r.created_at}-${i}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-fg/[0.04] text-xs font-semibold">{r.buyer.slice(0, 1)}</span>
                  <span>
                    {r.buyer}
                    <span className="block text-xs text-ink-400">
                      tier {r.tier} · {shortDate(r.created_at)}
                    </span>
                  </span>
                </span>
                <span className={`num font-semibold ${r.status === "reversed" ? "text-ink-400 line-through" : "text-ok"}`}>+{usd(r.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function WithdrawForm({ summary, onDone }: { summary: WithdrawalsSummary; onDone: () => void }) {
  const { mutate: refreshMe } = useMe();
  const [network, setNetwork] = useState<"trc20" | "bep20">("trc20");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const available = Number(summary.available);
  const min = Number(summary.min_withdrawal);
  const inProgress = summary.withdrawals.some((x) => ["pending", "awaiting_2fa", "processing"].includes(x.status));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await post("/me/withdrawals", {
        amount: String(fd.get("amount")),
        network,
        address: String(fd.get("address")).trim(),
        password: String(fd.get("password")),
      });
      setDone(true);
      e.currentTarget.reset();
      onDone();
      refreshMe();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Withdraw in USDT" description={`Referral credit becomes withdrawable ${summary.hold_days} days after the payment. Requests are reviewed, then sent automatically.`}>
      {inProgress ? (
        <div className="flex items-center gap-3 rounded-xl border border-amber/20 bg-amber/10 p-4 text-sm text-amber">
          <Hourglass className="h-5 w-5 shrink-0" /> You have a withdrawal in progress. You can request another once it&apos;s completed.
        </div>
      ) : available < min ? (
        <div className="rounded-xl border border-fg/[0.06] bg-fg/[0.02] p-4 text-sm text-ink-300">
          You can withdraw once you have at least <b className="text-ink-100">{usd(min)}</b> available (now {usd(available)}).
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {done && <p className="rounded-xl border border-ok/25 bg-ok/10 px-3 py-2 text-sm text-ok">Request received — we&apos;ll email you when it&apos;s sent.</p>}
          <div>
            <label className="label" htmlFor="w-amount">Amount (USDT)</label>
            <div className="relative">
              <input id="w-amount" name="amount" type="number" min={min} max={available} step="0.01" defaultValue={available} required className="input num pr-16" />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-ink-400">max {usd(available)}</span>
            </div>
          </div>
          <div>
            <span className="label">Network</span>
            <div className="grid grid-cols-2 gap-2">
              {(["trc20", "bep20"] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNetwork(n)}
                  aria-pressed={network === n}
                  className={`rounded-xl border p-3 text-left text-sm transition ${network === n ? "border-brand bg-brand/10" : "border-fg/[0.08] hover:border-fg/20"}`}
                >
                  <span className="font-semibold">USDT · {n.toUpperCase()}</span>
                  <span className="block text-xs text-ink-400">{n === "trc20" ? "Tron network" : "BNB Smart Chain"}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="w-address">Wallet address</label>
            <input id="w-address" name="address" required className="input num" placeholder={network === "trc20" ? "T…" : "0x…"} autoComplete="off" />
            <p className="mt-1.5 text-xs text-ink-400">Double-check it — crypto sent to a wrong address can&apos;t be recovered.</p>
          </div>
          <div>
            <label className="label" htmlFor="w-password">Confirm with your password</label>
            <input id="w-password" name="password" type="password" required className="input" autoComplete="current-password" />
          </div>
          <ErrorNote message={error} />
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? <Spinner /> : <ArrowUpRight className="h-4 w-4" />} Request withdrawal
          </button>
        </form>
      )}
    </Section>
  );
}

function WithdrawalRow({ w }: { w: Withdrawal }) {
  const label: Record<string, string> = {
    pending: "Under review",
    awaiting_2fa: "Approved — sending",
    processing: "Sending",
    paid: "Sent",
    rejected: "Declined",
    failed: "Failed — refunded",
  };
  return (
    <li className="rounded-xl border border-fg/[0.06] bg-fg/[0.02] px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="num font-semibold">{usd(w.amount)}</span>
        <StatusChip status={w.status === "awaiting_2fa" ? "processing" : w.status} label={label[w.status]} />
      </div>
      <p className="num mt-1 truncate text-xs text-ink-400">
        {w.network.toUpperCase()} · {w.address}
      </p>
      <p className="mt-1 text-xs text-ink-400">
        {shortDate(w.created_at)}
        {w.tx_hash && <span className="num"> · tx {w.tx_hash.slice(0, 14)}…</span>}
        {w.status === "rejected" && w.admin_note && <span> · {w.admin_note}</span>}
      </p>
    </li>
  );
}
