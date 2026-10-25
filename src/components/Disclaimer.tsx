import { TriangleAlert } from "lucide-react";

/** Risk notice shown in every footer. */
export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex gap-3 rounded-2xl border border-amber/20 bg-amber/[0.06] text-left ${compact ? "p-3 text-[0.7rem]" : "p-4 text-xs"} leading-relaxed text-ink-300`}>
      <TriangleAlert className={`shrink-0 text-amber ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
      <p>
        <b className="text-ink-100">Risk disclaimer.</b> Trading foreign exchange, gold, indices and other leveraged products carries a high level of risk
        and may not be suitable for everyone — you can lose some or all of your capital, and losses can exceed deposits. TradePilot EA is provided for{" "}
        <b className="text-ink-100">entertainment and educational purposes only</b>. It is not financial, investment or trading advice, and no
        result or profit is guaranteed. Past or simulated performance does not indicate future results. Only trade with money you can afford to
        lose, and seek independent advice if you are unsure.
      </p>
    </div>
  );
}
