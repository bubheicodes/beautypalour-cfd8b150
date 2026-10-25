"use client";

import { Withdrawals } from "@/components/admin";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Withdrawals" description="Referral cash-outs, checked automatically. Approve to send the USDT." />
      <Withdrawals />
    </>
  );
}
