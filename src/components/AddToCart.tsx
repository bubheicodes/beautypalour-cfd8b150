"use client";

import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

import { setCart } from "@/lib/cart";

/** Puts the plan in the cart and opens checkout (sign-up happens there if needed). */
export function AddToCart({ plan, label, className }: { plan: string; label: string; className: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        setCart(plan);
        router.push("/checkout");
      }}
    >
      <ShoppingCart className="h-4 w-4" /> {label}
    </button>
  );
}
