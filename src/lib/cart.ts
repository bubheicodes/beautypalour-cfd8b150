"use client";

// One-item cart kept in the browser, so visitors can pick a plan before they have an account.

import { useEffect, useState } from "react";

const KEY = "tp_cart";
const EVENT = "tp-cart";

export type Cart = { plan: string; added_at: number } | null;

export function getCart(): Cart {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Cart) : null;
  } catch {
    return null;
  }
}

export function setCart(plan: string | null) {
  try {
    if (plan) localStorage.setItem(KEY, JSON.stringify({ plan, added_at: Date.now() }));
    else localStorage.removeItem(KEY);
  } catch {
    // storage unavailable: checkout still works from the URL (?plan=…)
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useCart(): Cart {
  const [cart, set] = useState<Cart>(null);
  useEffect(() => {
    const sync = () => set(getCart());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return cart;
}
