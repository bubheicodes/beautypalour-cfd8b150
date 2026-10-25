"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

/** Dark (brand default) ↔ light. Saved per browser; applied before paint by the root layout. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [light, setLight] = useState(false);
  useEffect(() => setLight(document.documentElement.dataset.theme === "light"), []);

  function toggle() {
    const next = !light;
    setLight(next);
    if (next) document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("tp_theme", next ? "light" : "dark");
    } catch {
      // storage unavailable: the choice lasts for this page only
    }
  }

  return (
    <button
      onClick={toggle}
      className={`grid h-9 w-9 place-items-center rounded-xl text-ink-300 transition hover:bg-fg/[0.06] hover:text-ink-100 ${className}`}
      aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
      title={light ? "Dark theme" : "Light theme"}
    >
      {light ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
    </button>
  );
}
