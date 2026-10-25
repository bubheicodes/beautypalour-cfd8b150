"use client";

import { PaymentSettingsPanel } from "@/components/admin";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Settings" description="Payment gateway and payout configuration." />
      <PaymentSettingsPanel />
    </>
  );
}
