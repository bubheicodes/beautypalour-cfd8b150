"use client";

import { AnimatePresence, motion } from "motion/react";
import { LayoutDashboard, Menu, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/Logo";
import { ScrollProgress } from "@/components/motion";
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

const EASE = [0.22, 1, 0.36, 1] as const;

export function SiteNav() {
  const { user } = useMe();
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <ScrollProgress />
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-xl transition-all duration-300 ${
          scrolled
            ? "border-fg/[0.07] bg-ink-950/85 shadow-[0_12px_32px_-20px_rgb(0_0_0/0.65)]"
            : "border-transparent bg-ink-950/40"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="TradePilot EA home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {LINKS.map(([label, href]) => (
              <Link key={href} href={href} className="group relative rounded-lg px-3 py-2 text-ink-300 transition hover:text-ink-100">
                {label}
                <span className="absolute inset-x-3 bottom-1 h-px origin-center scale-x-0 rounded-full bg-gradient-to-r from-brand to-brand-light transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <Link
              href="/checkout"
              className="relative grid h-9 w-9 place-items-center rounded-xl text-ink-300 transition hover:bg-fg/[0.06] hover:text-ink-100"
              aria-label="Cart"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              {cart && (
                <span className="absolute -top-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-brand text-[0.6rem] font-bold text-white">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                  <span className="relative">1</span>
                </span>
              )}
            </Link>
            {user ? (
              <Link href="/dashboard" className="btn-primary px-3.5 py-2">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm text-ink-300 transition hover:text-ink-100 sm:block">
                  Sign in
                </Link>
                <Link href="/register" className="btn-primary px-3.5 py-2">
                  Get started
                </Link>
              </>
            )}
            <button
              className="grid h-9 w-9 place-items-center rounded-lg text-ink-300 transition hover:bg-fg/[0.05] md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="overflow-hidden border-t border-fg/[0.05] md:hidden"
            >
              <div className="px-4 py-3">
                {LINKS.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-ink-200 transition hover:bg-fg/[0.04]"
                  >
                    {label}
                  </Link>
                ))}
                {!user && (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-ink-200 transition hover:bg-fg/[0.04]"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
