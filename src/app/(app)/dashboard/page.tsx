"use client";

import { ArrowRight, CalendarClock, Gift, Rocket, ShoppingCart, Wallet } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

import { BuildCard, OrdersTable, PREPARING, SubscriptionCard, useDashboard } from "@/components/dashboard";
import { EmptyState, Loading, PageHeader, Section, StatCard } from "@/components/ui";
import { daysLeft, fetcher, usd, type Plan, type ReferralSummary } from "@/lib/api";

export default function OverviewPage() {
  const { data, mutate } = useDashboard();
  const { data: plans } = useSWR<Plan[]>("/plans", fetcher);
  const { data: referrals } = useSWR<ReferralSummary>("/me/referrals", fetcher);
  if (!data) return <Loading />;

  const { user, subscriptions, builds, orders } = data;
  const active = subscriptions.filter((s) => s.status === "active" && daysLeft(s.expires_at) > 0);
  const lifetime = active.some((s) => s.plan.lifetime);
  const soonest = active.filter((s) => !s.plan.lifetime).reduce<number | null>((m, s) => {
    const d = daysLeft(s.expires_at);
    return m == null || d < m ? d : m;
  }, null);
  const latest = builds[0];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.first_name || user.full_name.split(" ")[0]}`}
        description="Your EA, licence and earnings at a glance."
        actions={
          <Link href="/checkout" className="btn-primary">
            <ShoppingCart className="h-4 w-4" /> New subscription
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarClock}
          label="Licence"
          value={soonest != null ? `${soonest} day${soonest === 1 ? "" : "s"}` : lifetime ? "Lifetime" : "—"}
          hint={soonest != null ? "until the next renewal" : lifetime ? "never expires" : "No active plan"}
          tone={soonest != null && soonest <= 7 ? "amber" : "blue"}
        />
        <StatCard
          icon={Rocket}
          label="EA file"
          value={!latest ? "—" : PREPARING.has(latest.status) ? "Preparing" : "Ready"}
          hint={latest?.queue?.eta_seconds != null ? `#${latest.queue.position} in queue` : latest ? `order ${latest.order_code}` : "after your first payment"}
          tone={latest && PREPARING.has(latest.status) ? "amber" : "green"}
        />
        <StatCard
          icon={Gift}
          label="Referral earnings"
          value={usd(referrals?.earned_usd ?? 0)}
          hint={`${referrals?.tier1_count ?? 0} invited · ${referrals?.tier2_count ?? 0} via them`}
          tone="blue"
        />
        <StatCard icon={Wallet} label="Account credit" value={usd(user.credit_usd)} hint="used on renewals or withdrawn" tone="green" />
      </div>

      {subscriptions.length === 0 ? (
        <Section className="mt-6">
          <EmptyState
            icon={Rocket}
            title="No subscription yet"
            body="Choose a plan to get your personal, account-locked copy of TradePilot — ready in minutes."
            action={
              <Link href="/checkout" className="btn-primary">
                View plans <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        </Section>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="min-w-0 space-y-6">
            {latest && <BuildCard build={latest} onChange={() => mutate()} />}
            <Section
              title="Recent orders"
              action={
                <Link href="/dashboard/billing" className="text-sm text-brand-light hover:underline">
                  View all
                </Link>
              }
            >
              <div className="-mx-5 -mb-5 sm:-mx-6 sm:-mb-6">
                <OrdersTable orders={orders.slice(0, 5)} />
              </div>
            </Section>
          </div>
          <div className="min-w-0 space-y-6">
            {subscriptions.map((s) => (
              <SubscriptionCard key={s.id} sub={s} plans={plans ?? []} />
            ))}
            <ReferralTeaser code={referrals?.code} percent={referrals?.tier1_percent} />
          </div>
        </div>
      )}
    </>
  );
}

function ReferralTeaser({ code, percent }: { code?: string; percent?: string }) {
  if (!code) return null;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-deep/25 via-ink-900 to-ink-900 p-6">
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-brand/20 blur-3xl" />
      <Gift className="relative h-6 w-6 text-brand-light" />
      <h3 className="relative mt-3 font-semibold">Invite traders, earn USDT</h3>
      <p className="relative mt-1 text-sm text-ink-300">
        Earn {Number(percent ?? 0)}% of a new trader&apos;s first payment, withdrawable in USDT.
      </p>
      <Link href="/dashboard/referrals" className="btn-ghost relative mt-4">
        Get your link <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
