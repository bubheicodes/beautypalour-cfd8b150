"use client";

import Link from "next/link";
import useSWR from "swr";

import { OrdersTable, SubscriptionCard, useDashboard } from "@/components/dashboard";
import { Loading, PageHeader, Section } from "@/components/ui";
import { fetcher, usd, type Plan } from "@/lib/api";

export default function BillingPage() {
  const { data } = useDashboard();
  const { data: plans } = useSWR<Plan[]>("/plans", fetcher);
  if (!data) return <Loading />;

  return (
    <>
      <PageHeader
        title="Billing"
        description={
          Number(data.user.credit_usd) > 0
            ? `You have ${usd(data.user.credit_usd)} of credit, applied at checkout unless you keep it for a withdrawal.`
            : "Your subscriptions, renewals and payment history."
        }
        actions={
          <Link href="/checkout" className="btn-primary">
            New subscription
          </Link>
        }
      />
      {data.subscriptions.length > 0 && (
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          {data.subscriptions.map((s) => (
            <SubscriptionCard key={s.id} sub={s} plans={plans ?? []} />
          ))}
        </div>
      )}
      <Section title="Payment history">
        <div className="-mx-5 -mb-5 sm:-mx-6 sm:-mb-6">
          <OrdersTable orders={data.orders} />
        </div>
      </Section>
    </>
  );
}
