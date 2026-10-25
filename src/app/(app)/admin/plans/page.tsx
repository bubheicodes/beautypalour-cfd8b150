"use client";

import { Plans } from "@/components/admin";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Plans" description="Design the pricing cards customers see. Changes apply to new orders immediately." />
      <Plans />
    </>
  );
}
