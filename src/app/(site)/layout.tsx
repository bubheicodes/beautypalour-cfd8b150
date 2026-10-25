import Link from "next/link";

import { Disclaimer } from "@/components/Disclaimer";
import { Logo } from "@/components/Logo";
import { Banners } from "@/components/notifications";
import { SiteNav } from "@/components/SiteNav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-bg flex min-h-dvh flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 sm:px-6">
        <div className="pt-4 empty:hidden">
          <Banners source="/announcements" />
        </div>
        {children}
      </main>
      {/* mt-auto via flex-1 above: the footer sits at the very bottom even on short pages. */}
      <footer className="border-t border-fg/[0.05] bg-ink-950/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-ink-400">
              Automated trading technology for MetaTrader 5. Trade smarter. Trade with precision.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-ink-300 uppercase">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-400">
              <li><Link href="/#features" className="hover:text-ink-100">Features</Link></li>
              <li><Link href="/#pricing" className="hover:text-ink-100">Pricing</Link></li>
              <li><Link href="/#faq" className="hover:text-ink-100">FAQ</Link></li>
              <li><Link href="/help" className="hover:text-ink-100">Help centre</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-ink-300 uppercase">Account</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-400">
              <li><Link href="/login" className="hover:text-ink-100">Sign in</Link></li>
              <li><Link href="/register" className="hover:text-ink-100">Create account</Link></li>
              <li><Link href="/dashboard" className="hover:text-ink-100">Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <Disclaimer />
        </div>
        <p className="border-t border-fg/[0.04] px-4 py-6 text-center text-xs text-ink-400">
          © {new Date().getFullYear()} TradePilot EA · For entertainment and educational purposes only · IP geolocation by{" "}
          <a href="https://db-ip.com" className="hover:text-ink-100">DB-IP</a>
        </p>
      </footer>
    </div>
  );
}
