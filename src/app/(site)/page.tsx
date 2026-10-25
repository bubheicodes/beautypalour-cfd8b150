import {
  ArrowRight,
  BadgeCheck,
  Bitcoin,
  Gauge,
  KeyRound,
  LineChart,
  RefreshCcw,
  ShieldCheck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { LogoMark } from "@/components/Logo";
import { Float, Grow, Marquee, Reveal, Stagger, StaggerItem, TextReveal, Tilt } from "@/components/motion";
import { PlanCard } from "@/components/PlanCard";
import { usd, type Plan } from "@/lib/api";

export const dynamic = "force-dynamic";

async function getPlans(): Promise<Plan[]> {
  const base = process.env.INTERNAL_API_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${base}/plans`, { next: { revalidate: 30 } });
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

const FEATURES = [
  [Zap, "Ready in minutes", "Pay and your personal copy is compiled automatically. Live queue position and wait time while it builds."],
  [KeyRound, "Licensed to your accounts", "Each file works only on the MT5 accounts you register. Swap accounts from your dashboard."],
  [RefreshCcw, "Renew without reinstalling", "Renewals and upgrades apply to your running EA within 30 minutes — no new file to install."],
  [ShieldCheck, "Built-in risk controls", "Fixed lot or % risk, daily drawdown limit and an account guard that locks trading at your limit."],
  [Bitcoin, "Pay with USDT", "Checkout in USDT on TRC20 or BEP20. Payment is confirmed on-chain, automatically."],
  [Users, "Earn by referring", "Share your link and earn credit on referred traders' first payment — withdraw it in USDT."],
] as const;

const STEPS = [
  ["Pick a plan", "Choose the plan that suits you and enter the MT5 account numbers you trade on."],
  ["Pay in USDT", "Pay a USDT invoice on TRC20 or BEP20 — it's confirmed automatically on-chain."],
  ["We build your copy", "Your personal EA is compiled in minutes. Watch your place in the queue live."],
  ["Attach & trade", "Download it, attach it to a chart in MT5 and let it run. Renewals apply by themselves."],
];

const FAQ = [
  ["Which brokers and accounts does it work on?", "Any MetaTrader 5 broker. You register the login number and broker server of each account; the EA runs only on those."],
  ["How long until I get my EA?", "Usually a few minutes after your payment confirms. Your order page shows your place in the queue and a live wait time."],
  ["What happens when my plan ends?", "The EA stops opening new trades but keeps managing the ones that are open. Renew and it continues — no new file needed."],
  ["Can I change my MT5 account?", "Yes — up to two swaps per period from your dashboard. Fixing a typo in the broker server doesn't count as a swap."],
  ["How do referral earnings work?", "When someone you invite makes their first payment, you earn a percentage as credit, plus a smaller share when people they invite pay. Use it on renewals or withdraw it in USDT."],
] as const;

const MARQUEE: [LucideIcon, string][] = [
  [Zap, "Personal build in minutes"],
  [KeyRound, "Licensed to your MT5 accounts"],
  [Bitcoin, "USDT · TRC20 & BEP20"],
  [RefreshCcw, "Renewals apply automatically"],
  [ShieldCheck, "Daily drawdown guard"],
  [Gauge, "Fixed lot or % risk"],
  [LineChart, "Works on any MT5 broker"],
  [Users, "Referral rewards in USDT"],
];

export default async function Home() {
  const plans = await getPlans();
  const cheapest = plans.reduce<Plan | undefined>((a, p) => (!a || Number(p.price_usd_now) < Number(a.price_usd_now) ? p : a), undefined);
  const baseline = plans.reduce<Plan | undefined>((a, p) => (!a || p.days < a.days ? p : a), undefined);
  const start = `/checkout${cheapest ? `?plan=${cheapest.code}` : ""}`;

  return (
    <>
      {/* hero */}
      <section className="relative grid items-center gap-14 pt-16 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute top-24 -right-32 -z-10 h-80 w-80 animate-float-slow rounded-full bg-brand/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 -left-40 -z-10 h-72 w-72 animate-float-slow rounded-full bg-brand-deep/15 blur-3xl [animation-delay:2s]"
        />
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-[0.7rem] font-semibold tracking-[0.22em] text-brand-light uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
            Automated Trading Technology
          </p>
          <h1 className="mt-6 text-[2.6rem] leading-[1.04] font-extrabold tracking-tight sm:text-6xl">
            <TextReveal text="Trade smarter." className="block" delay={0.15} />
            <TextReveal text="Trade with precision." className="block" wordClassName="text-shimmer" delay={0.45} stagger={0.09} />
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
            TradePilot is an Expert Advisor for MetaTrader 5. Every subscriber gets a personally compiled copy, licensed
            to their own accounts — attach it and it trades.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={start} className="btn-primary px-6 py-3 text-base">
              Start{cheapest ? ` from ${usd(cheapest.price_usd_now)}` : ""} <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link href="#pricing" className="btn-ghost px-6 py-3 text-base">
              See plans
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-400">
            <span className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-ok" /> Pay with USDT</span>
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-brand-light" /> Ready in minutes</span>
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-light" /> Risk controls built in</span>
          </div>
        </div>
        <HeroPanel />
      </section>

      {/* capability ticker */}
      <div className="border-y border-fg/[0.05] bg-ink-900/40 py-4">
        <Marquee duration={32}>
          {MARQUEE.map(([Icon, label]) => (
            <span key={label} className="mx-7 flex items-center gap-2.5 text-sm whitespace-nowrap text-ink-300">
              <Icon className="h-4 w-4 text-brand-light" />
              {label}
            </span>
          ))}
        </Marquee>
      </div>

      {/* features */}
      <section id="features" className="scroll-mt-24 py-16">
        <SectionHeading eyebrow="Why TradePilot" title="Everything handled for you" />
        <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([Icon, title, body]) => (
            <StaggerItem key={title} className="h-full">
              <Tilt className="h-full">
                <div className="card card-hover h-full p-6 hover:-translate-y-1">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand/25 to-brand/5 text-brand-light transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-300">{body}</p>
                </div>
              </Tilt>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* how it works */}
      <section id="how" className="scroll-mt-24 py-16">
        <SectionHeading eyebrow="How it works" title="From payment to trading in four steps" />
        <div className="relative">
          <Grow className="absolute top-[42px] right-10 left-10 hidden h-px origin-left bg-gradient-to-r from-brand/50 via-brand/25 to-transparent lg:block" />
          <Stagger className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.12}>
            {STEPS.map(([title, body], i) => (
              <StaggerItem key={title} className="h-full">
                <div className="card card-hover h-full p-6">
                  <span className="num grid h-9 w-9 place-items-center rounded-full border border-brand/30 bg-brand/10 text-sm font-semibold text-brand-light shadow-[0_0_0_5px] shadow-brand/[0.06]">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-300">{body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="scroll-mt-24 py-16">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple plans, paid in USDT"
          body="Every plan includes updates for its period and a 48-hour grace window."
        />
        <Stagger className="mt-12 grid gap-6 sm:grid-cols-[repeat(auto-fit,minmax(270px,1fr))]" gap={0.1}>
          {plans.length === 0 && <p className="card col-span-full p-6 text-ink-300">Plans are loading — refresh in a moment.</p>}
          {plans.map((plan) => (
            <StaggerItem key={plan.code} className="h-full transition duration-300 hover:-translate-y-1.5">
              <PlanCard plan={plan} baseline={baseline} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 py-16">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {FAQ.map(([q, a], i) => (
            <Reveal key={q} delay={i * 0.05}>
            <details className="card group p-5 transition-colors hover:border-brand/20 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {q}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-fg/[0.05] text-ink-300 transition duration-300 group-open:rotate-45 group-open:bg-brand/15 group-open:text-brand-light">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-300">{a}</p>
            </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <Reveal className="py-16">
        <div className="border-beam rounded-3xl">
          <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-brand-deep/30 via-ink-900 to-ink-900 p-10 text-center sm:p-14">
            <div className="absolute -top-24 left-1/2 h-64 w-[36rem] animate-pulse-soft -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" />
            <LogoMark className="relative mx-auto h-10 w-auto" />
            <h2 className="relative mt-6 text-3xl font-bold tracking-tight sm:text-4xl">Ready to let TradePilot trade for you?</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-ink-300">Create your account, pick a plan and have your EA running in minutes.</p>
            <Link href={start} className="btn-primary relative mt-8 px-7 py-3 text-base">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Reveal>
    </>
  );
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-brand-light uppercase">
        <span className="h-px w-6 bg-gradient-to-r from-transparent to-brand-light/60" />
        {eyebrow}
        <span className="h-px w-6 bg-gradient-to-l from-transparent to-brand-light/60" />
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {body && <p className="mt-3 text-ink-300">{body}</p>}
    </Reveal>
  );
}

function HeroPanel() {
  // Illustrative EA panel and dashboard snippet — no performance claims.
  const rows: [string, string, string][] = [
    ["Licence", "ACTIVE", "text-ok"],
    ["Account", "12345678 · Live", "text-ink-100"],
    ["Risk mode", "1.0% per trade", "text-ink-100"],
    ["Daily drawdown", "0.00% / 3.00%", "text-ok"],
    ["Status", "ACTIVE", "text-ok"],
  ];
  return (
    <Float className="relative animate-fade-up [animation-delay:120ms]">
      <div className="absolute -inset-6 animate-pulse-soft rounded-[2rem] bg-gradient-to-br from-brand/20 via-transparent to-brand-deep/10 blur-2xl" />
      <Tilt max={9}>
        <div className="card relative overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-fg/[0.06] bg-ink-850/80 px-5 py-3.5">
            <span className="flex items-center gap-2.5 text-sm font-semibold">
              <LogoMark className="h-4 w-auto" /> TradePilot EA
            </span>
            <span className="flex items-center gap-1.5 text-xs text-ok">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ok" /> running
            </span>
          </div>
          <div className="divide-y divide-fg/[0.05] px-5">
            {rows.map(([k, v, c]) => (
              <div key={k} className="flex items-center justify-between py-3.5 text-sm">
                <span className="text-ink-400">{k}</span>
                <span className={`num font-medium ${c}`}>{v}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-px border-t border-fg/[0.06] bg-fg/[0.04]">
            {[
              [Gauge, "Trailing stop", "10 pips"],
              [LineChart, "Timeframe", "M5"],
              [ShieldCheck, "Guard", "10%"],
            ].map(([Icon, k, v]) => {
              const I = Icon as typeof Gauge;
              return (
                <div key={k as string} className="bg-ink-900 px-4 py-4">
                  <I className="h-4 w-4 text-brand-light" />
                  <p className="mt-2 text-xs text-ink-400">{k as string}</p>
                  <p className="num text-sm font-semibold">{v as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Tilt>
    </Float>
  );
}
