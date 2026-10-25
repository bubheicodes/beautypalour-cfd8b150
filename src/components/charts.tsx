"use client";

// Small, dependency-free charts for the staff analytics page. Single series each (one hue, no
// legend needed), thin bars with rounded data-ends on a recessive grid, hover tooltip per bar.

import { motion } from "motion/react";
import { useState } from "react";

type Point = { label: string; value: number };

export function BarChart({ data, format, height = 180 }: { data: Point[]; format: (n: number) => string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 0);
  const top = niceCeil(max);
  const ticks = [top, top / 2, 0];
  const labelEvery = Math.max(1, Math.ceil(data.length / 5));

  return (
    <div className="relative">
      <div className="flex gap-3">
        {/* y axis */}
        <div className="flex flex-col justify-between py-0 text-right text-[0.65rem] text-ink-400" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="num -translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {format(t)}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {/* grid */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" style={{ height }}>
            {ticks.map((t) => (
              <div key={t} className={`h-px ${t === 0 ? "bg-fg/20" : "bg-fg/[0.06]"}`} />
            ))}
          </div>
          {/* bars */}
          <div className="relative flex items-end gap-[2px]" style={{ height }} onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => {
              const h = top ? (d.value / top) * 100 : 0;
              return (
                <div
                  key={d.label}
                  className="group relative flex h-full flex-1 cursor-default items-end justify-center"
                  onMouseEnter={() => setHover(i)}
                  role="img"
                  aria-label={`${d.label}: ${format(d.value)}`}
                >
                  <motion.div
                    className={`w-full max-w-5 rounded-t-[4px] ${hover === i ? "bg-brand-light" : "bg-brand"}`}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${Math.max(h, d.value > 0 ? 1.5 : 0)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: i * 0.012, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              );
            })}
          </div>
          {hover != null && (
            <div
              className="card pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full px-3 py-2 text-xs whitespace-nowrap shadow-xl"
              style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
            >
              <p className="text-ink-400">{data[hover].label}</p>
              <p className="num font-semibold text-ink-100">{format(data[hover].value)}</p>
            </div>
          )}
          {/* x labels */}
          <div className="relative mt-2 h-4 text-[0.65rem] text-ink-400">
            {data.map((d, i) =>
              i % labelEvery === 0 ? (
                <span
                  key={d.label}
                  className="absolute -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${((i + 0.5) / data.length) * 100}%` }}
                >
                  {d.label}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Ranked horizontal bars (one hue), value labels in text colour. */
export function RankBars({ data, format }: { data: Point[]; format: (n: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={d.label} className="text-sm">
          <div className="mb-1 flex justify-between gap-3">
            <span className="truncate text-ink-200">{d.label}</span>
            <span className="num text-ink-100">{format(d.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-fg/[0.05]">
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={{ width: 0 }}
              whileInView={{ width: `${(d.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function niceCeil(n: number): number {
  if (n <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(n));
  const f = n / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}
