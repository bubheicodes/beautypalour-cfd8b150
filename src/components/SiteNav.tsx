"use client";

import { LayoutDashboard, Menu, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCart } from "@/lib/cart";
import { useMe } from "@/lib/hooks";

const LINKS = [
  ["Features", "/#features"],
  ["How it works", "/#how"],
  ["Pricing", "/#pricing"],
  ["FAQ", "/#faq"],
  ["Help", "/help"],
] as const;

export function SiteNav() {
  const { user } = useMe();
  const cart = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-fg/[0.05] bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="TradePilot EA home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-lg px-3 py-2 text-ink-300 transition hover:bg-fg/[0.04] hover:text-ink-100">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Link href="/checkout" className="relative grid h-9 w-9 place-items-center rounded-xl text-ink-300 transition hover:bg-fg/[0.06] hover:text-ink-100" aria-label="Cart">
            <ShoppingCart className="h-4.5 w-4.5" />
            {cart && <span className="absolute -top-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-brand text-[0.6rem] font-bold text-white">1</span>}
          </Link>
          {user ? (
            <Link href="/dashboard" className="btn-primary px-3.5 py-2">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm text-ink-300 hover:text-ink-100 sm:block">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary px-3.5 py-2">
                Get started
              </Link>
            </>
          )}
          <button
            className="grid h-9 w-9 place-items-center rounded-lg text-ink-300 hover:bg-fg/[0.05] md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-fg/[0.05] px-4 py-3 md:hidden">
          {LINKS.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-ink-200 hover:bg-fg/[0.04]">
              {label}
            </Link>
          ))}
          {!user && (
            <Link href="/login" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-ink-200 hover:bg-fg/[0.04]">
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
