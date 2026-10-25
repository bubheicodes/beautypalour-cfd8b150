"use client";

import { Rocket } from "lucide-react";
import Link from "next/link";

import { AccountsCard, BuildCard, useDashboard } from "@/components/dashboard";
import { EmptyState, Loading, PageHeader, Section } from "@/components/ui";

export default function EaPage() {
  const { data, mutate } = useDashboard();
  if (!data) return <Loading />;
  const { builds, subscriptions } = data;

  return (
    <>
      <PageHeader title="My EA" description="Download your personal copy and manage the MT5 accounts it runs on." />
      {builds.length === 0 && subscriptions.length === 0 ? (
        <Section>
          <EmptyState
            icon={Rocket}
            title="No EA yet"
            body="Your file appears here a few minutes after your first payment."
            action={
              <Link href="/checkout" className="btn-primary">
                Choose a plan
              </Link>
            }
          />
        </Section>
      ) : (
        <div className="space-y-6">
          {builds.map((b) => (
            <BuildCard key={b.id} build={b} onChange={() => mutate()} />
          ))}
          {subscriptions.map((s) => (
            <AccountsCard key={s.id} sub={s} onChange={() => mutate()} />
          ))}
        </div>
      )}
    </>
  );
}
