import { useId } from "react";

/** The TP mark: italic white (or navy) T, electric-blue gradient P. */
export function LogoMark({ className = "h-7 w-auto", light = false }: { className?: string; light?: boolean }) {
  const id = useId();
  return (
    <svg viewBox="0 0 54 36" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5CC2FF" />
          <stop offset="1" stopColor="#0B6FE8" />
        </linearGradient>
      </defs>
      <g transform="translate(10.5 0) skewX(-16)">
        <path d="M2 2H26L24.9 9H17.6L13.6 34H5.8L9.8 9H0.9Z" fill={light ? "#0B1A33" : "var(--logo-t, #fff)"} />
        <path
          fill={`url(#${id})`}
          fillRule="evenodd"
          d="M21.2 2H37.5A9.5 9.5 0 0 1 37.5 21H29.8L27.7 34H19.9Z M31 8.6L30.2 14.4H37.4A2.9 2.9 0 0 0 37.4 8.6Z"
        />
      </g>
    </svg>
  );
}

/** Mark + "TRADEPILOT — EA —" wordmark, as on the brand sheet. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className={compact ? "h-6 w-auto" : "h-8 w-auto"} />
      <span className="flex flex-col items-center leading-none">
        <span className={`font-bold tracking-[0.08em] ${compact ? "text-sm" : "text-base"}`}>
          TRADE<span className="text-brand-gradient">PILOT</span>
        </span>
        <span className="mt-1 flex w-full items-center gap-1.5 text-[0.55rem] font-semibold tracking-[0.35em] text-ink-300">
          <span className="h-px flex-1 bg-ink-400/60" />
          EA
          <span className="h-px flex-1 bg-ink-400/60" />
        </span>
      </span>
    </span>
  );
}
