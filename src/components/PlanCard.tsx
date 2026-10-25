import { Check, Infinity as InfinityIcon } from "lucide-react";
import Link from "next/link";

import { AddToCart } from "@/components/AddToCart";
import { shortDate, usd, type Plan } from "@/lib/api";

/** Built-in bullets, shown when the admin hasn't written features for a card. */
function defaultFeatures(plan: Plan): string[] {
  const accounts = plan.live_slots + plan.demo_slots;
  return [
    plan.lifetime ? "Lifetime access — never expires" : `${plan.days} days of access`,
    `${plan.live_slots} live + ${plan.demo_slots} demo MT5 account${accounts > 2 ? "s" : ""}`,
    "Up to 2 account swaps per period",
    "Renewal reminders by SMS & email",
  ];
}

/** Price per day compared with the shortest plan, as "save N%". */
function saving(plan: Plan, baseline?: Plan): number {
  if (!baseline || baseline.code === plan.code || plan.lifetime || baseline.lifetime) return 0;
  const perDay = Number(baseline.price_usd_now) / baseline.days;
  return Math.round((1 - Number(plan.price_usd_now) / (perDay * plan.days)) * 100);
}

export function PlanCard({ plan, baseline, href, preview = false }: { plan: Plan; baseline?: Plan; href?: string; preview?: boolean }) {
  const save = saving(plan, baseline);
  const features = plan.features.length ? plan.features : defaultFeatures(plan);
  const cta = `Choose ${plan.name}`;
  const ctaClass = `${plan.highlight ? "btn-primary" : "btn-ghost"} mt-8 w-full`;
  return (
    <div
      className={`relative flex h-full flex-col rounded-3xl p-[1px] ${
        plan.highlight ? "bg-gradient-to-b from-brand/70 via-brand/20 to-transparent" : "bg-fg/[0.06]"
      }`}
    >
      <div className="relative flex h-full flex-col rounded-[calc(1.5rem-1px)] bg-ink-900 p-6 sm:p-7">
        {plan.badge && (
          <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-brand to-brand-deep px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-brand/30">
            {plan.badge}
          </span>
        )}
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-semibold">{plan.name}</h3>
          {plan.discount > 0 ? (
            <span className="num rounded-full bg-ok/10 px-2 py-0.5 text-xs font-semibold text-ok">−{plan.discount}%</span>
          ) : (
            save > 0 && <span className="num rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand-light">save {save}%</span>
          )}
        </div>
        {plan.description && <p className="mt-1 text-sm text-ink-300">{plan.description}</p>}
        <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
          <span className="num text-4xl font-bold tracking-tight">{usd(plan.price_usd_now)}</span>
          {plan.discount > 0 && <span className="num text-lg text-ink-400 line-through">{usd(plan.price_usd)}</span>}
          <span className="text-sm text-ink-400">{plan.lifetime ? "once" : `/ ${plan.days} days`}</span>
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
          {plan.lifetime && <InfinityIcon className="h-3.5 w-3.5 text-brand-light" />}
          {plan.lifetime ? "One-time payment · lifetime access" : "Paid in USDT · TRC20 or BEP20"}
        </p>
        {plan.discount > 0 && (plan.discount_label || plan.discount_ends_at) && (
          <p className="mt-2 text-xs font-medium text-ok">
            {plan.discount_label}
            {plan.discount_label && plan.discount_ends_at && " · "}
            {plan.discount_ends_at && `ends ${shortDate(plan.discount_ends_at)}`}
          </p>
        )}
        <ul className="mt-6 flex-1 space-y-3 text-sm text-ink-200">
          {features.map((f) => (
            <li key={f} className="flex gap-2.5">
              <span className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-brand/15 text-brand-light">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              {f}
            </li>
          ))}
        </ul>
        {preview ? (
          <span className={`${ctaClass} pointer-events-none`}>{cta}</span>
        ) : href ? (
          <Link href={href} className={ctaClass}>
            {cta}
          </Link>
        ) : (
          <AddToCart plan={plan.code} label={cta} className={ctaClass} />
        )}
      </div>
    </div>
  );
}
