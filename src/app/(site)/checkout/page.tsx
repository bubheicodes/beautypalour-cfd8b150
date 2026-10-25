"use client";

import { ArrowRight, Bitcoin, Check, Globe2, Infinity as InfinityIcon, Lock, PauseCircle, ShoppingCart, TicketPercent, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import useSWR from "swr";

import { AuthFields, useReferralCode } from "@/components/AuthForm";
import { Reveal } from "@/components/motion";
import { EmptyState, ErrorNote, Loading, PageHeader, Section, Spinner } from "@/components/ui";
import {
  fetcher,
  post,
  shortDate,
  usd,
  type AccountInput,
  type CouponCheck,
  type Dashboard,
  type Geo,
  type Order,
  type PaymentMethods,
  type Plan,
} from "@/lib/api";
import { setCart, useCart } from "@/lib/cart";
import { useMe } from "@/lib/hooks";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Checkout />
    </Suspense>
  );
}

function Checkout() {
  const params = useSearchParams();
  const router = useRouter();
  const cart = useCart();
  const { user, isLoading: userLoading } = useMe();
  const referral = useReferralCode(params.get("ref"));
  const { data: plans } = useSWR<Plan[]>("/plans", fetcher);
  const { data: dash } = useSWR<Dashboard>(user ? "/me/dashboard" : null, fetcher);
  const { data: methods } = useSWR<PaymentMethods>("/payment-methods", fetcher);
  const { data: geo } = useSWR<Geo>("/geo", fetcher);

  const renewId = params.get("renew");
  const upgradeId = params.get("upgrade");
  const subId = renewId ?? upgradeId;
  const kind = renewId ? "renewal" : upgradeId ? "upgrade" : "new";
  const sub = dash?.subscriptions.find((s) => s.id === subId);

  const [planCode, setPlanCode] = useState(params.get("plan") ?? "");
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [useCredit, setUseCredit] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [couponText, setCouponText] = useState(params.get("coupon") ?? "");
  const [coupon, setCoupon] = useState<CouponCheck | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!planCode && cart?.plan) setPlanCode(cart.plan);
  }, [cart, planCode]);

  const choices = useMemo(() => (kind === "upgrade" && sub ? plans?.filter((p) => p.days > sub.plan.days) : plans) ?? [], [plans, kind, sub]);
  // The plan in the link may have been withdrawn since (or never set): fall back to the first card.
  const plan = choices.find((p) => p.code === planCode) ?? choices[0];
  const credit = Number(dash?.user.credit_usd ?? 0);
  const ready = methods?.crypto && methods.crypto_ready;
  const planPrice = plan ? Number(plan.price_usd_now) : 0;
  const couponOff = coupon ? Number(coupon.discount) : 0;
  const price = Math.max(0, planPrice - couponOff);
  const creditUsed = useCredit && kind !== "upgrade" ? Math.min(credit, price) : 0;

  async function applyCoupon(code = couponText) {
    if (!plan || !code.trim()) return;
    setChecking(true);
    setCouponError(null);
    try {
      setCoupon(await post<CouponCheck>("/coupons/check", { code: code.trim(), plan_code: plan.code, kind }));
    } catch (err) {
      setCoupon(null);
      setCouponError((err as Error).message);
    } finally {
      setChecking(false);
    }
  }

  // A code from the link is tried once the plans load; a chosen code is re-checked per plan.
  const planKey = plan?.code;
  useEffect(() => {
    if (planKey && (coupon || params.get("coupon"))) applyCoupon(coupon?.code ?? couponText);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the plan changes
  }, [planKey]);
  const blocked = geo?.blocked;

  function choose(code: string) {
    setPlanCode(code);
    if (kind === "new") setCart(code);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!plan || !user) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    const accounts: AccountInput[] = [];
    if (kind === "new") {
      for (const type of ["live", "demo"] as const) {
        const slots = type === "live" ? plan.live_slots : plan.demo_slots;
        for (let i = 0; i < slots; i++) {
          const login = String(fd.get(`${type}-${i}-login`) ?? "").trim();
          const server = String(fd.get(`${type}-${i}-server`) ?? "").trim();
          if (!login && !server) continue;
          if (!/^\d{3,12}$/.test(login) || !server) {
            setError(`Enter both the login number and broker server for each ${type} account`);
            return;
          }
          accounts.push({ mt5_login: Number(login), broker_server: server, type });
        }
      }
      if (accounts.length === 0) {
        setError("Add at least one MT5 account to license");
        return;
      }
    }
    setBusy(true);
    try {
      const order = await post<Order>("/orders", {
        plan_code: plan.code,
        method: "crypto",
        kind,
        subscription_id: subId ?? undefined,
        accounts,
        use_credit: useCredit,
        coupon_code: coupon?.code,
      });
      setCart(null);
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (!plans || !methods || userLoading) return <Loading />;
  if (kind === "renewal" && sub?.plan.lifetime) {
    return (
      <Section className="mt-12">
        <EmptyState icon={InfinityIcon} title="You have lifetime access" body="Your licence never expires — there's nothing to renew." action={<Link href="/dashboard" className="btn-primary">Back to dashboard</Link>} />
      </Section>
    );
  }
  const title = kind === "renewal" ? "Renew your licence" : kind === "upgrade" ? "Upgrade your plan" : "Checkout";

  return (
    <div className="py-10">
      <PageHeader
        title={title}
        description={
          sub ? (
            <>
              Current plan <b className="text-ink-100">{sub.plan.name}</b>, licensed until <b className="text-ink-100">{shortDate(sub.expires_at)}</b>.{" "}
              {kind === "renewal" ? "The new period is added on top of your current expiry." : "Unused days are credited against the new plan; the new term starts today."}
            </>
          ) : (
            "Your cart — add your MT5 accounts, then pay in USDT."
          )
        }
      />

      {blocked && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber/25 bg-amber/10 p-4 text-sm text-amber">
          <Globe2 className="mt-0.5 h-5 w-5 shrink-0" /> {geo?.message}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <Reveal>
            <Section title="1 · Your plan" action={cart && kind === "new" ? <CartClear /> : undefined}>
              <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
                {choices.map((p) => {
                  const active = p.code === plan?.code;
                  return (
                    <label
                      key={p.code}
                      className={`relative cursor-pointer rounded-2xl border p-4 transition ${active ? "border-brand bg-brand/10 shadow-[0_0_0_1px] shadow-brand/40" : "border-fg/[0.08] hover:border-fg/20"}`}
                    >
                      <input type="radio" name="plan" value={p.code} checked={active} onChange={() => choose(p.code)} className="sr-only" />
                      {active && (
                        <span className="absolute top-3 right-3 grid h-5 w-5 place-items-center rounded-full bg-brand text-white">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                      <span className="block font-semibold">{p.name}</span>
                      <span className="num mt-2 block text-xl font-bold">{usd(p.price_usd_now)}</span>
                      {p.discount > 0 && (
                        <span className="num text-xs text-ink-400">
                          <span className="line-through">{usd(p.price_usd)}</span> <span className="text-ok">−{p.discount}%</span>
                        </span>
                      )}
                      <span className="mt-2 block text-xs text-ink-400">
                        {p.lifetime ? "Lifetime" : `${p.days} days`} · {p.live_slots} live + {p.demo_slots} demo
                      </span>
                    </label>
                  );
                })}
                {choices.length === 0 && <p className="text-sm text-ink-300">You&apos;re already on the longest plan.</p>}
              </div>
            </Section>
          </Reveal>

          {kind === "new" && plan && (
            <Reveal delay={0.05}>
              <Section title="2 · MT5 accounts to license" description="Your EA will only run on these logins. Find them in MT5 under File → Login to Trade Account.">
                <div className="space-y-4">
                  {(["live", "demo"] as const).flatMap((type) =>
                    Array.from({ length: type === "live" ? plan.live_slots : plan.demo_slots }, (_, i) => (
                      <div key={`${plan.code}-${type}-${i}`} className="grid gap-3 sm:grid-cols-[90px_1fr_1.4fr] sm:items-end">
                        <span className={`num pb-3 text-xs font-semibold tracking-wider uppercase ${type === "live" ? "text-ok" : "text-brand-light"}`}>
                          {type} #{i + 1}
                        </span>
                        <div>
                          <label className="label" htmlFor={`${type}-${i}-login`}>Login</label>
                          <input className="input num" id={`${type}-${i}-login`} name={`${type}-${i}-login`} inputMode="numeric" placeholder="12345678" />
                        </div>
                        <div>
                          <label className="label" htmlFor={`${type}-${i}-server`}>Broker server</label>
                          <input className="input" id={`${type}-${i}-server`} name={`${type}-${i}-server`} placeholder={type === "live" ? "Exness-MT5Real8" : "Exness-MT5Trial"} maxLength={64} />
                        </div>
                      </div>
                    )),
                  )}
                </div>
              </Section>
            </Reveal>
          )}
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
          {!user && (
            <Reveal>
              <div className="card p-6">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Lock className="h-4 w-4 text-brand-light" /> {kind === "new" ? "3 · " : ""}Your account
                </h2>
                <p className="mt-1 mb-5 text-sm text-ink-300">Create an account or sign in to finish — your cart is kept.</p>
                <AuthFields mode={authMode} onModeChange={setAuthMode} referral={referral} onSuccess={() => undefined} />
              </div>
            </Reveal>
          )}
          <Reveal delay={0.05}>
            <div className="card p-6">
              <h2 className="flex items-center gap-2 font-semibold">
                <ShoppingCart className="h-4 w-4 text-brand-light" /> Summary
              </h2>
              {plan && (
                <dl className="mt-5 space-y-3 text-sm">
                  <Row label={`${plan.name} · ${plan.lifetime ? "lifetime" : `${plan.days} days`}`} value={usd(plan.price_usd)} />
                  {plan.discount > 0 && <Row label={plan.discount_label ?? `Discount ${plan.discount}%`} value={`−${usd(Number(plan.price_usd) - planPrice)}`} tone="text-ok" />}
                  {coupon && couponOff > 0 && <Row label={`Promo ${coupon.code}`} value={`−${usd(couponOff)}`} tone="text-ok" />}
                  {creditUsed > 0 && <Row label="Account credit" value={`−${usd(creditUsed)}`} tone="text-ok" />}
                  {kind === "upgrade" && <p className="text-xs text-ink-400">Unused days on your current plan are credited when the order is created.</p>}
                  <div className="h-px bg-fg/[0.06]" />
                  <Row label="Total" value={usd(Math.max(0, price - creditUsed))} bold />
                </dl>
              )}
              <div className="mt-5">
                {coupon ? (
                  <div className="flex items-center gap-3 rounded-xl border border-ok/25 bg-ok/[0.07] p-3 text-sm">
                    <TicketPercent className="h-4.5 w-4.5 shrink-0 text-ok" />
                    <span className="min-w-0 flex-1">
                      <span className="num font-semibold text-ink-100">{coupon.code}</span> applied
                      {coupon.description && <span className="block text-xs text-ink-400">{coupon.description}</span>}
                    </span>
                    <button type="button" className="text-xs text-ink-400 hover:text-ink-100" onClick={() => (setCoupon(null), setCouponText(""))}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="label" htmlFor="coupon">Promo code</label>
                    <div className="flex gap-2">
                      <input
                        id="coupon"
                        className="input num uppercase"
                        value={couponText}
                        maxLength={32}
                        onChange={(e) => setCouponText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyCoupon();
                          }
                        }}
                        placeholder="Optional"
                      />
                      <button type="button" className="btn-ghost shrink-0" disabled={checking || !couponText.trim()} onClick={() => applyCoupon()}>
                        {checking ? <Spinner /> : "Apply"}
                      </button>
                    </div>
                    {couponError && <p className="mt-1.5 text-xs text-loss">{couponError}</p>}
                  </div>
                )}
              </div>
              {credit > 0 && kind !== "upgrade" && (
                <label className="mt-5 flex items-start gap-3 rounded-xl border border-fg/[0.06] bg-fg/[0.02] p-3 text-sm">
                  <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} className="mt-0.5 accent-brand" />
                  <span>
                    Use my {usd(credit)} credit
                    <span className="block text-xs text-ink-400">Untick to keep it for a referral withdrawal.</span>
                  </span>
                </label>
              )}
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-brand/20 bg-brand/[0.06] p-3 text-sm">
                <Bitcoin className="h-5 w-5 shrink-0 text-brand-light" />
                <span>
                  Pay in <b>USDT</b>
                  <span className="block text-xs text-ink-400">TRC20 or BEP20 via NOWPayments</span>
                </span>
              </div>
              {!ready && (
                <p className="mt-4 flex items-center gap-2 text-sm text-amber">
                  <PauseCircle className="h-4 w-4" /> Payments are paused right now — please check back shortly.
                </p>
              )}
              <div className="mt-4">
                <ErrorNote message={error} />
              </div>
              <button className="btn-primary mt-4 w-full py-3 text-base" disabled={busy || !user || !plan || !ready || blocked || (kind !== "new" && !sub)}>
                {busy ? <Spinner /> : null} {user ? "Continue to payment" : "Sign in to continue"} <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-3 text-center text-xs text-ink-400">
                By continuing you accept the risk disclaimer below. Prices are confirmed by our server at payment.
              </p>
            </div>
          </Reveal>
        </aside>
      </form>
    </div>
  );
}

function CartClear() {
  return (
    <button type="button" onClick={() => setCart(null)} className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-loss">
      <Trash2 className="h-3.5 w-3.5" /> Empty cart
    </button>
  );
}

function Row({ label, value, tone = "", bold = false }: { label: string; value: string; tone?: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${bold ? "text-base font-semibold" : ""}`}>
      <dt className={bold ? "" : "text-ink-300"}>{label}</dt>
      <dd className={`num ${tone}`}>{value}</dd>
    </div>
  );
}
