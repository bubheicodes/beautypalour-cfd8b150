"use client";

import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  BookOpen,
  BarChart3,
  Bot,
  ChevronDown,
  Cog,
  CreditCard,
  Gauge,
  Gift,
  Globe2,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  MailWarning,
  Megaphone,
  Menu,
  MessagesSquare,
  PackageCheck,
  Plus,
  Receipt,
  Settings,
  ShieldAlert,
  ShieldCheck,
  TicketPercent,
  UserCog,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import useSWR from "swr";

import { Disclaimer } from "@/components/Disclaimer";
import { Logo } from "@/components/Logo";
import { Banners, InboxBell } from "@/components/notifications";
import { PageTransition } from "@/components/motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loading } from "@/components/ui";
import { can, fetcher, post, usd, type AdminStats, type Permission } from "@/lib/api";
import { useMe } from "@/lib/hooks";

type Item = { href: string; label: string; icon: LucideIcon; badge?: keyof AdminStats; perm?: Permission };

const CUSTOMER: Item[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/ea", label: "My EA", icon: Bot },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/referrals", label: "Referrals", icon: Gift },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
  { href: "/dashboard/account", label: "Account", icon: UserCog },
  { href: "/help", label: "Help centre", icon: BookOpen },
];

// Staff menu, filtered by the signed-in role's permissions.
const ADMIN: Item[] = [
  { href: "/admin", label: "Overview", icon: Gauge, perm: "view" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, perm: "analytics" },
  { href: "/admin/users", label: "Users", icon: Users, perm: "view" },
  { href: "/admin/team", label: "Team & roles", icon: ShieldCheck, perm: "view" },
  { href: "/admin/activity", label: "Staff activity", icon: Activity, perm: "analytics" },
  { href: "/admin/tickets", label: "Tickets", icon: MessagesSquare, badge: "open_tickets", perm: "view" },
  { href: "/admin/kb", label: "Help articles", icon: BookOpen, perm: "kb" },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone, perm: "view" },
  { href: "/admin/builds", label: "Build queue", icon: Cog, badge: "queued_builds", perm: "view" },
  { href: "/admin/delivered", label: "Delivered", icon: PackageCheck, perm: "view" },
  { href: "/admin/orders", label: "Orders", icon: Receipt, perm: "view" },
  { href: "/admin/payments", label: "Payment issues", icon: AlertTriangle, badge: "open_payment_issues", perm: "finance.view" },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: Wallet, badge: "pending_withdrawals", perm: "finance.view" },
  { href: "/admin/plans", label: "Plans", icon: LayoutGrid, perm: "view" },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent, perm: "finance.view" },
  { href: "/admin/referrals", label: "Referrals", icon: Gift, perm: "finance.view" },
  { href: "/admin/countries", label: "Access rules", icon: Globe2, perm: "view" },
  { href: "/admin/settings", label: "Payment settings", icon: Settings, perm: "finance.view" },
];

const ROLE_LABEL: Record<string, string> = { admin: "Admin", management: "Management", support: "Support" };

const TITLES: Record<string, string> = {
  "/checkout": "Checkout",
  "/orders": "Order",
  ...Object.fromEntries([...CUSTOMER, ...ADMIN].map((i) => [i.href, i.label])),
};

function titleFor(path: string): string {
  const match = Object.keys(TITLES)
    .filter((k) => path === k || path.startsWith(`${k}/`))
    .sort((a, b) => b.length - a.length)[0];
  return match ? TITLES[match] : "TradePilot";
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user, isLoading, mutate, offline } = useMe();
  const [open, setOpen] = useState(false);
  const adminArea = path.startsWith("/admin");
  const staff = can(user, "view");
  // Staff tools stay locked until two-factor login is on (the API refuses them too).
  const locked = !!user && user.two_factor_required && !user.two_factor;
  const { data: stats } = useSWR<AdminStats>(staff && !locked ? "/admin/stats" : null, fetcher, { refreshInterval: 30000 });

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (isLoading || user === undefined) return; // unknown yet (or the API is restarting)
    if (user === null) router.replace(`/login?next=${encodeURIComponent(path)}`);
    else if (adminArea && !can(user, "view")) router.replace("/dashboard");
  }, [isLoading, user, adminArea, path, router]);

  async function logout() {
    await post("/auth/logout");
    await mutate(undefined, { revalidate: true });
    router.push("/");
    router.refresh();
  }

  if (!user || (adminArea && !staff)) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-950 px-4 text-center">
        <div>
          <Loading />
          {offline && (
            <p className="mt-2 text-sm text-ink-400">
              Can&apos;t reach TradePilot right now — reconnecting…
              <button className="ml-2 text-brand-light hover:underline" onClick={() => mutate()}>
                Retry
              </button>
            </p>
          )}
        </div>
      </div>
    );
  }

  const items = adminArea ? ADMIN.filter((i) => !i.perm || can(user, i.perm)) : CUSTOMER;
  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <Link href="/" aria-label="TradePilot EA home">
          <Logo compact />
        </Link>
        <button className="grid h-8 w-8 place-items-center rounded-lg text-ink-300 hover:bg-fg/[0.05] lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-2 pb-2 [scrollbar-width:thin]">
        <p className="px-3 pb-2 text-[0.65rem] font-semibold tracking-[0.2em] text-ink-400 uppercase">{adminArea ? ROLE_LABEL[user.role] ?? "Staff" : "Menu"}</p>
        <nav className="space-y-0.5">
          {items.map((item) => {
            const active = item.href === "/dashboard" || item.href === "/admin" ? path === item.href : path.startsWith(item.href);
            const count = item.badge && stats ? Number(stats[item.badge]) : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-gradient-to-r from-brand/20 to-brand/5 text-ink-100" : "text-ink-300 hover:bg-fg/[0.04] hover:text-ink-100"
                }`}
              >
                {active && <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand" />}
                <item.icon className={`h-4.5 w-4.5 ${active ? "text-brand-light" : "text-ink-400 group-hover:text-ink-300"}`} />
                <span className="flex-1">{item.label}</span>
                {count > 0 && <span className="num rounded-full bg-amber/15 px-2 py-0.5 text-[0.7rem] font-semibold text-amber">{count}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 space-y-2 border-t border-fg/[0.05] p-3">
        {!adminArea && (
          <Link href="/checkout" className="btn-primary w-full">
            <Plus className="h-4 w-4" /> New subscription
          </Link>
        )}
        {staff && (
          <Link href={adminArea ? "/dashboard" : "/admin"} className="btn-ghost w-full">
            <ArrowLeftRight className="h-4 w-4" /> {adminArea ? "Customer view" : `${ROLE_LABEL[user.role]} panel`}
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-ink-950">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-fg/[0.05] bg-ink-900/60 backdrop-blur-xl lg:block">{sidebar}</aside>
      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-fg/[0.06] bg-ink-900 shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-h-dvh flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-fg/[0.05] bg-ink-950/75 px-4 backdrop-blur-xl sm:px-6">
          <button className="grid h-9 w-9 place-items-center rounded-lg text-ink-300 hover:bg-fg/[0.05] lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{titleFor(path)}</p>
            <p className="hidden text-xs text-ink-400 sm:block">{adminArea ? `${ROLE_LABEL[user.role] ?? "Staff"} panel` : "TradePilot EA"}</p>
          </div>
          {!adminArea && Number(user.credit_usd) > 0 && (
            <Link href="/dashboard/referrals" className="hidden items-center gap-2 rounded-xl border border-ok/20 bg-ok/10 px-3 py-1.5 text-xs font-semibold text-ok sm:flex">
              <Wallet className="h-3.5 w-3.5" /> Credit {usd(user.credit_usd)}
            </Link>
          )}
          {adminArea && stats && (
            <span
              className={`hidden items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium sm:flex ${
                stats.compiler_online ? "border-ok/20 bg-ok/10 text-ok" : "border-amber/20 bg-amber/10 text-amber"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full bg-current ${stats.compiler_online ? "animate-pulse" : ""}`} />
              Compiler {stats.compiler_online ? "online" : "offline"}
            </span>
          )}
          <ThemeToggle />
          <InboxBell />
          <UserMenu name={user.full_name} email={user.email} role={user.role} onLogout={logout} />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Banners source="/me/announcements" />
          {!adminArea && !user.email_verified_at && <VerifyNudge />}
          {adminArea && locked ? <TwoFactorGate /> : <PageTransition>{children}</PageTransition>}
        </main>
        {/* Pinned to the bottom of the page: the flex column pushes it down on short pages. */}
        <footer className="border-t border-fg/[0.05] bg-ink-900/40">
          <div className="mx-auto w-full max-w-6xl space-y-3 px-4 py-5 sm:px-6 lg:px-8">
            <Disclaimer compact />
            <p className="text-center text-[0.7rem] text-ink-400">
              © {new Date().getFullYear()} TradePilot EA · For entertainment and educational purposes only ·{" "}
              <Link href="/help" className="hover:text-ink-100">Help centre</Link>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function VerifyNudge() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber/25 bg-amber/[0.07] px-4 py-3 text-sm">
      <MailWarning className="h-4 w-4 shrink-0 text-amber" />
      <p className="flex-1 text-ink-200">Please confirm your email address — we sent you a link when you signed up.</p>
      <Link href="/dashboard/account" className="font-medium text-brand-light hover:underline">
        Resend link
      </Link>
    </div>
  );
}

function TwoFactorGate() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber/10 text-amber">
        <ShieldAlert className="h-7 w-7" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">Turn on two-factor login</h1>
      <p className="mt-2 text-sm text-ink-300">
        Staff accounts can see customer data and money, so they need a code from an authenticator app at every sign-in. It takes a minute.
      </p>
      <Link href="/dashboard/account#security" className="btn-primary mt-6">
        <ShieldCheck className="h-4 w-4" /> Set it up now
      </Link>
    </div>
  );
}

function UserMenu({ name, email, role, onLogout }: { name: string; email: string; role: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-fg/[0.05]" aria-expanded={open}>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-deep text-xs font-bold text-white">{initials || "?"}</span>
        <ChevronDown className="hidden h-4 w-4 text-ink-400 sm:block" />
      </button>
      {open && (
        <div className="card absolute top-12 right-0 w-64 p-2 shadow-2xl">
          <div className="px-3 py-2.5">
            <p className="flex items-center gap-2 truncate text-sm font-semibold">
              {name}
              {role !== "user" && <span className="rounded-md bg-brand/15 px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wide text-brand-light uppercase">{role}</span>}
            </p>
            <p className="truncate text-xs text-ink-400">{email}</p>
          </div>
          <div className="my-1 h-px bg-fg/[0.06]" />
          <Link href="/dashboard/account" onClick={() => setOpen(false)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-300 hover:bg-fg/[0.05] hover:text-ink-100">
            <UserCog className="h-4 w-4" /> Account settings
          </Link>
          <Link href="/dashboard/support" onClick={() => setOpen(false)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-300 hover:bg-fg/[0.05] hover:text-ink-100">
            <LifeBuoy className="h-4 w-4" /> Support
          </Link>
          <button onClick={onLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-300 hover:bg-fg/[0.05] hover:text-ink-100">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
