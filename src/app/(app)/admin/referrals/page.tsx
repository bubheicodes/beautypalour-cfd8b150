"use client";

import { Referrals } from "@/components/admin";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Referrals" description="Two-tier rewards on a new client's first payment." />
      <Referrals />
    </>
  );
}
