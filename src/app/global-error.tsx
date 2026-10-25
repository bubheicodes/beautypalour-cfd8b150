"use client";

// Last resort when the root layout itself fails: no app styles are guaranteed here, so it is
// self-contained. Still never a blank page.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#040a17", color: "#e8eef7", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <main style={{ padding: 24, maxWidth: 420 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#8ea0bd" }}>TradePilot couldn&apos;t load this page. Please reload.</p>
          {error.digest && <p style={{ color: "#8ea0bd", fontSize: 12 }}>Reference: {error.digest}</p>}
          <button onClick={() => reset()} style={{ marginRight: 8, padding: "10px 16px", borderRadius: 10, border: 0, background: "#2563eb", color: "#fff", cursor: "pointer" }}>
            Try again
          </button>
          <button onClick={() => window.location.reload()} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #334155", background: "transparent", color: "#e8eef7", cursor: "pointer" }}>
            Reload page
          </button>
        </main>
      </body>
    </html>
  );
}
