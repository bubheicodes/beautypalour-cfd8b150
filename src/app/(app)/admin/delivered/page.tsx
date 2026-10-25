"use client";

import { Delivered } from "@/components/admin";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <>
      <PageHeader title="Delivered files" description="Every delivered EA, where it runs, and revoke or rebuild controls." />
      <Delivered />
    </>
  );
}
