"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";

const RELOADED = "tp_chunk_reload";

/** A JS file from an older build is gone (the site was redeployed while this tab was open). */
function isStaleBuild(error: Error): boolean {
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(`${error.name} ${error.message}`);
}

/** Shown instead of a blank page when rendering fails. Stale-build errors reload once by themselves. */
export function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const stale = isStaleBuild(error);

  useEffect(() => {
    console.error(error);
    if (!stale) return;
    try {
      if (sessionStorage.getItem(RELOADED)) return; // reloaded once already: show the screen
      sessionStorage.setItem(RELOADED, "1");
    } catch {
      // storage unavailable: still reload once for this page view
    }
    window.location.reload();
  }, [error, stale]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        sessionStorage.removeItem(RELOADED);
      } catch {
        // nothing to clear
      }
    }, 10000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="grid min-h-[60vh] place-items-center px-4 py-16 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber/10 text-amber">
          <TriangleAlert className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">{stale ? "TradePilot was just updated" : "Something went wrong"}</h1>
        <p className="mt-2 text-sm text-ink-300">
          {stale ? "Reloading to get the latest version…" : "This page hit an unexpected error. Reloading usually fixes it — if it keeps happening, contact support."}
        </p>
        {error.digest && <p className="num mt-2 text-xs text-ink-400">Reference: {error.digest}</p>}
        <div className="mt-6 flex justify-center gap-2">
          <button className="btn-primary" onClick={() => (stale ? window.location.reload() : reset())}>
            <RotateCw className="h-4 w-4" /> Try again
          </button>
          <button className="btn-ghost" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
