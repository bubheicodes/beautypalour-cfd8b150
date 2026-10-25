"use client";

import { ArrowRight, Bitcoin, Check, CircleDashed, Clock, Cog, Download, PartyPopper } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import useSWR from "swr";

import { ErrorNote, Loading, PageHeader, QueueStatus, Spinner, StatusChip } from "@/components/ui";
import { fetcher, post, shortDate, usd, type OrderStatusOut } from "@/lib/api";

const OPEN = new Set(["pending", "failed", "underpaid"]);
const PREPARING = new Set(["queued", "compiling", "failed"]);

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [polling, setPolling] = useState(true);
  const { data: order, error } = useSWR<OrderStatusOut>(`/orders/${id}`, fetcher, {
    refreshInterval: polling ? 3000 : 0, // while paying, and while the EA is being built
  });

  useEffect(() => {
    if (!order) return;
    setPolling(OPEN.has(order.status) || (order.status === "paid" && PREPARING.has(order.build_status ?? "")));
  }, [order]);

  if (error) return <PageHeader title="Order not found" />;
  if (!order) return <Loading />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={headline(order)} description={`Order ${order.code} · ${order.plan.name}`} actions={<StatusChip status={order.status} />} />
      {order.status === "paid" && <Progress order={order} />}
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="card p-6">
          {order.status === "paid" && <Paid order={order} />}
          {order.status === "refunded" && <p className="text-ink-300">This order was refunded.</p>}
          {order.status === "cancelled" && (
            <div className="space-y-4">
              <p className="text-ink-300">{order.failure_reason ?? "This order was cancelled"}. Prices are worked out when you order, so please start a new one.</p>
              <Link href="/checkout" className="btn-primary">
                New order
              </Link>
            </div>
          )}
          {OPEN.has(order.status) && <CryptoPay order={order} />}
        </div>
        <Summary order={order} />
      </div>
    </div>
  );
}

function headline(o: OrderStatusOut): string {
  if (o.status === "paid") {
    if (PREPARING.has(o.build_status ?? "")) return o.build_status === "compiling" ? "Compiling your EA" : "Preparing your EA";
    return o.build_status ? "Your EA is ready" : "Licence extended";
  }
  if (o.status === "underpaid") return "Almost there";
  if (o.status === "failed") return "Payment didn't go through";
  if (o.status === "cancelled") return "Order expired";
  if (o.gateway_status && ["confirming", "confirmed", "sending"].includes(o.gateway_status)) return "Confirming payment";
  return "Complete your payment";
}

function Progress({ order }: { order: OrderStatusOut }) {
  if (!order.build_status) return null;
  const stage = order.build_status === "compiling" ? 2 : PREPARING.has(order.build_status) ? 1 : 3;
  const steps = [
    [Check, "Paid"],
    [Clock, "In queue"],
    [Cog, "Compiling"],
    [Download, "Ready"],
  ] as const;
  return (
    <ol className="card mb-6 grid grid-cols-4 gap-2 p-4">
      {steps.map(([Icon, label], i) => {
        const done = i < stage || stage === 3;
        const current = i === stage && stage !== 3;
        return (
          <li key={label} className="flex flex-col items-center gap-2 text-center">
            <span
              className={`grid h-9 w-9 place-items-center rounded-full border ${
                done ? "border-ok/40 bg-ok/15 text-ok" : current ? "border-brand/50 bg-brand/15 text-brand-light" : "border-fg/10 text-ink-400"
              }`}
            >
              {current ? <CircleDashed className="h-4 w-4 animate-spin [animation-duration:3s]" /> : <Icon className="h-4 w-4" />}
            </span>
            <span className={`text-xs ${done || current ? "text-ink-100" : "text-ink-400"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Summary({ order }: { order: OrderStatusOut }) {
  return (
    <aside className="card h-fit p-6 text-sm">
      <h2 className="font-semibold">Summary</h2>
      <dl className="mt-4 space-y-3">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-300">
            {order.plan.name} · {order.plan.days}d {order.kind !== "new" && <span className="text-ink-400">({order.kind})</span>}
          </dt>
          <dd className="num">{usd(order.list_price)}</dd>
        </div>
        {Number(order.discount_applied) > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-300">Discount</dt>
            <dd className="num text-ok">−{usd(order.discount_applied)}</dd>
          </div>
        )}
        {Number(order.coupon_discount) > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-300">Promo {order.coupon_code}</dt>
            <dd className="num text-ok">−{usd(order.coupon_discount)}</dd>
          </div>
        )}
        {Number(order.credit_applied) > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-300">Credit</dt>
            <dd className="num text-ok">−{usd(order.credit_applied)}</dd>
          </div>
        )}
        <div className="h-px bg-fg/[0.06]" />
        <div className="flex justify-between text-base font-semibold">
          <dt>Total</dt>
          <dd className="num">{usd(order.amount)}</dd>
        </div>
        {Number(order.amount_paid) > 0 && order.status !== "paid" && (
          <div className="flex justify-between">
            <dt className="text-ink-300">Received</dt>
            <dd className="num">{usd(order.amount_paid)}</dd>
          </div>
        )}
      </dl>
      <p className="mt-4 text-xs text-ink-400">Created {shortDate(order.created_at)}</p>
    </aside>
  );
}

function CryptoPay({ order }: { order: OrderStatusOut }) {
  const [network, setNetwork] = useState<"trc20" | "bep20">("trc20");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirming = order.gateway_status && ["confirming", "confirmed", "sending"].includes(order.gateway_status);
  const due = order.status === "underpaid" ? order.shortfall : order.amount;

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const { invoice_url } = await post<{ invoice_url: string }>(`/orders/${order.id}/crypto`, { network });
      const url = new URL(invoice_url);
      if (url.protocol !== "https:") throw new Error("Unexpected invoice link");
      window.location.assign(url.toString());
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-start gap-4">
        <Spinner className="h-6 w-6 text-amber" />
        <div>
          <p className="font-semibold">Payment seen on the blockchain</p>
          <p className="mt-1 text-sm text-ink-300">Waiting for network confirmations. This page updates by itself.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {order.status === "failed" && <ErrorNote message={`${order.failure_reason ?? "Invoice expired"}. Create a new invoice below.`} />}
      {order.status === "underpaid" && (
        <p className="rounded-xl border border-amber/25 bg-amber/10 px-3 py-2 text-sm text-amber">Short by {usd(order.shortfall)}. Pay the difference with a top-up invoice.</p>
      )}
      <div>
        <p className="label">Choose a network</p>
        <div className="grid grid-cols-2 gap-3">
          {(["trc20", "bep20"] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNetwork(n)}
              aria-pressed={network === n}
              className={`rounded-xl border p-4 text-left text-sm transition ${network === n ? "border-brand bg-brand/10" : "border-fg/[0.08] hover:border-fg/20"}`}
            >
              <span className="font-semibold">USDT · {n.toUpperCase()}</span>
              <span className="block text-xs text-ink-400">{n === "trc20" ? "Tron network" : "BNB Smart Chain"}</span>
            </button>
          ))}
        </div>
      </div>
      <button className="btn-primary w-full py-3 text-base" onClick={pay} disabled={busy}>
        {busy ? <Spinner /> : <Bitcoin className="h-4 w-4" />} Pay {usd(due)} in USDT
      </button>
      <ErrorNote message={error} />
      <p className="text-xs text-ink-400">You&apos;ll be taken to a secure NOWPayments invoice with the exact amount and address. Payment confirms automatically.</p>
    </div>
  );
}

function Paid({ order }: { order: OrderStatusOut }) {
  const preparing = PREPARING.has(order.build_status ?? "");
  if (preparing && order.queue) {
    return (
      <div className="space-y-5">
        <QueueStatus queue={order.queue} building={order.build_status === "compiling"} />
        <p className="text-sm text-ink-300">
          Payment received. We&apos;re compiling your personal copy of TradePilot, licensed to your MT5 accounts. You can leave this page — we&apos;ll email
          and SMS you when it&apos;s ready.
        </p>
        <Link href="/dashboard/ea" className="btn-ghost">
          Go to My EA <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-4 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok/15 text-ok">
        <PartyPopper className="h-7 w-7" />
      </span>
      <p className="text-ink-300">
        {order.build_status
          ? "Your EA file is ready. Download it and attach it in MT5."
          : "Payment received and your licence is extended. Your EA picks this up by itself within 30 minutes — no new file to install."}
      </p>
      <Link href="/dashboard/ea" className="btn-primary">
        {order.build_status ? "Download my EA" : "Go to My EA"} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
