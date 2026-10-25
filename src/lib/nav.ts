// Only follow same-site relative redirects (blocks open-redirects like ?next=//evil.com).
export function safeNext(raw: string | null, fallback = "/dashboard"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
