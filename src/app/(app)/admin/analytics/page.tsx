"use client";

import { Activity, CircleDollarSign, Infinity as InfinityIcon, LifeBuoy, Percent, Repeat, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

import { BarChart, RankBars } from "@/components/charts";
import { CountUp, Stagger, StaggerItem } from "@/components/motion";
import { Loading, PageHeader, Section, StatCard } from "@/components/ui";
import { fetcher, usd, type Analytics } from "@/lib/api";
import { countryName, flag } from "@/lib/countries";

const RANGES = [7, 30, 90, 365] as const;

export default function AnalyticsPage() {
  const [days, setDays] = useState<number>(30);
  const { data } = useSWR<Analytics>(`/admin/analytics?days=${days}`, fetcher);

  const picker = (
    <div className="flex gap-1 rounded-xl bg-fg/[0.04] p-1 text-sm">
      {RANGES.map((d) => (
        <button key={d} onClick={() => setDays(d)} className={`rounded-lg px-3 py-1.5 transition ${days === d ? "bg-ink-900 font-semibold text-ink-100 shadow" : "text-ink-400 hover:text-ink-100"}`}>
          {d === 365 ? "1y" : `${d}d`}
        </button>
      ))}
    </div>
  );
  if (!data) {
    return (
      <>
        <PageHeader title="Analytics" actions={picker} />
        <Loading />
      </>
    );
  }
  const t = data.totals;
  const delta = t.revenue_prev ? ((t.revenue - t.revenue_prev) / t.revenue_prev) * 100 : null;
  const label = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const money = (n: number) => usd(Math.round(n));

  return (
    <>
      <PageHeader title="Analytics" description={`Business performance over the last ${days} days.`} actions={picker} />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <StatCard
            icon={CircleDollarSign}
            label="Revenue"
            value={<CountUp value={t.revenue} format={money} />}
            hint={delta == null ? "no earlier period to compare" : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(0)}% vs previous ${days} days`}
            tone={delta == null || delta >= 0 ? "green" : "red"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={UserPlus} label="New sign-ups" value={<CountUp value={t.signups} />} hint={`${t.conversion}% of them paid`} />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={Users} label="Active subscriptions" value={<CountUp value={t.active_subscriptions} />} hint={`${t.lifetime_subscriptions} lifetime · ${t.paying_customers} paying customers`} />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={Percent} label="Revenue per customer" value={<CountUp value={t.arpu} format={money} />} hint="all-time average" tone="amber" />
        </StaggerItem>
      </Stagger>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Section title="Revenue per day" description="Paid orders, USD">
          <BarChart data={data.series.map((s) => ({ label: label(s.date), value: s.revenue }))} format={money} />
        </Section>
        <Section title="Sign-ups per day" description="New accounts">
          <BarChart data={data.series.map((s) => ({ label: label(s.date), value: s.signups }))} format={(n) => Math.round(n).toString()} />
        </Section>
        <Section title="Orders per day" description="Paid orders (new, renewals, upgrades)">
          <BarChart data={data.series.map((s) => ({ label: label(s.date), value: s.orders }))} format={(n) => Math.round(n).toString()} />
        </Section>
        <Section title="Revenue by plan">
          {data.by_plan.length ? (
            <RankBars data={data.by_plan.map((p) => ({ label: `${p.plan} · ${p.orders} order${p.orders === 1 ? "" : "s"}`, value: p.revenue }))} format={money} />
          ) : (
            <p className="text-sm text-ink-400">No paid orders in this period.</p>
          )}
        </Section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr] [&>*]:min-w-0">
        <Section title="Customers by country" description="Top 10 by sign-ups">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-ink-400">
              <tr>
                <th className="pb-2 font-medium">Country</th>
                <th className="pb-2 text-right font-medium">Users</th>
                <th className="pb-2 text-right font-medium">Paying</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fg/[0.04]">
              {data.by_country.map((c) => (
                <tr key={c.country}>
                  <td className="py-2">
                    {c.country === "??" ? "Not given" : `${flag(c.country)} ${countryName(c.country)}`}
                  </td>
                  <td className="num py-2 text-right">{c.users}</td>
                  <td className="num py-2 text-right">{c.paying}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Section title="Operations">
          <ul className="space-y-3 text-sm">
            {[
              [Repeat, "Renewals", t.renewals],
              [Activity, "Subscriptions ended", t.churned],
              [InfinityIcon, "Lifetime members", t.lifetime_subscriptions],
              [CircleDollarSign, "Referral rewards", usd(t.referral_rewards)],
              [CircleDollarSign, "Referral payouts sent", usd(t.payouts)],
              [LifeBuoy, "Open tickets", t.open_tickets],
              [LifeBuoy, "Avg. first reply", t.first_response_minutes == null ? "—" : `${t.first_response_minutes} min`],
            ].map(([Icon, k, v]) => {
              const I = Icon as typeof Repeat;
              return (
                <li key={k as string} className="flex items-center justify-between gap-3 rounded-xl bg-fg/[0.02] px-3 py-2.5">
                  <span className="flex items-center gap-2.5 text-ink-300">
                    <I className="h-4 w-4 text-brand-light" /> {k as string}
                  </span>
                  <span className="num font-semibold">{v as string | number}</span>
                </li>
              );
            })}
          </ul>
        </Section>
      </div>
    </>
  );
}
