"use client";

import { BuildQueue } from "@/components/admin";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Build queue" description="Paid orders being compiled. Failed builds wait here with the compiler log." />
      <BuildQueue />
    </>
  );
}
