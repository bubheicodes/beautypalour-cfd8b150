"use client";

import { AlertTriangle, ArrowRight, Bot, CircleDollarSign, Cog, MessagesSquare, PackageCheck, Timer, Users, Wallet } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

import { CountUp, Stagger, StaggerItem } from "@/components/motion";
import { Loading, PageHeader, Section, StatCard } from "@/components/ui";
import { can, duration, fetcher, type AdminStats, type Permission } from "@/lib/api";
import { useMe } from "@/lib/hooks";

export default function AdminOverview() {
  const { user } = useMe();
  const { data: s } = useSWR<AdminStats>("/admin/stats", fetcher, { refreshInterval: 15000 });
  if (!s) return <Loading />;

  const attention = (
    [
      [s.open_tickets, "tickets waiting for a reply", "/admin/tickets", MessagesSquare, null, "view"],
      [s.queued_builds, "builds in progress", "/admin/builds", Cog, s.failed_builds ? `${s.failed_builds} failed` : null, "view"],
      [s.pending_withdrawals, "withdrawals to review", "/admin/withdrawals", Wallet, null, "finance.view"],
      [s.open_payment_issues, "payment notices to check", "/admin/payments", AlertTriangle, null, "finance.view"],
      [s.flagged_builds, "files flagged for sharing", "/admin/delivered", PackageCheck, null, "view"],
    ] as const
  ).filter((row) => can(user, row[5] as Permission));

  return (
    <>
      <PageHeader title="Operations" description="Everything that needs you, in one place." />
      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <StatCard icon={Users} label="Active subscriptions" value={<CountUp value={s.active_subscriptions} />} tone="blue" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={CircleDollarSign} label="Paid orders (30 days)" value={<CountUp value={s.paid_orders_30d} />} tone="green" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={Bot} label="EAs running (1 h)" value={<CountUp value={s.running_eas} />} tone="blue" />
        </StaggerItem>
        <StaggerItem>
        <StatCard
          icon={Timer}
          label="Compiler"
          value={s.compiler_online ? "Online" : "Offline"}
          hint={`~${duration(s.avg_compile_seconds)} per build`}
          tone={s.compiler_online ? "green" : "amber"}
        />
        </StaggerItem>
      </Stagger>

      <Section title="Needs attention" className="mt-6">
        <ul className="grid gap-3 sm:grid-cols-2">
          {attention.map(([count, label, href, Icon, extra]) => (
            <li key={href}>
              <Link href={href} className="card-hover flex items-center gap-4 rounded-xl border border-fg/[0.06] bg-fg/[0.02] p-4">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${count ? "bg-amber/15 text-amber" : "bg-fg/[0.04] text-ink-400"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="num text-xl font-semibold">{count}</span> <span className="text-sm text-ink-300">{label}</span>
                  {extra && <span className="block text-xs text-loss">{extra}</span>}
                </span>
                <ArrowRight className="h-4 w-4 text-ink-400" />
              </Link>
            </li>
          ))}
        </ul>
        {!s.compiler_online && (
          <p className="mt-4 rounded-xl border border-amber/20 bg-amber/10 p-3 text-sm text-amber">
            No compiler has checked in for 90 seconds. Paid orders wait in the build queue — start the compiler (docker compose --profile compiler up -d) or
            upload builds by hand.
          </p>
        )}
      </Section>
    </>
  );
}
