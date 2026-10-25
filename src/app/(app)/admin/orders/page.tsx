"use client";

import { Orders } from "@/components/admin";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Orders" description="Search, activate by hand or refund orders." />
      <Orders />
    </>
  );
}
