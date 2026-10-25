"use client";

import { Payments } from "@/components/admin";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Payment issues" description="Payment notices that couldn't be applied automatically." />
      <Payments />
    </>
  );
}
