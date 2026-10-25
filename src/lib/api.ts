// Typed client for the FastAPI backend. Always same-origin (/api/*) so the httpOnly session
// cookie is sent automatically; every request also carries the CSRF header the API requires.
// Payments are in USDT, so amounts on this site are USD.

export type Plan = {
  code: string;
  name: string;
  lifetime: boolean;
  description: string;
  features: string[];
  badge: string | null;
  highlight: boolean;
  days: number;
  /** List price; what customers pay today is price_usd_now (after `discount` %). */
  price_usd: string;
  discount: number;
  discount_label: string | null;
  discount_ends_at: string | null;
  price_usd_now: string;
  live_slots: number;
  demo_slots: number;
};

export type User = {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: Role;
  is_admin: boolean;
  email_verified_at: string | null;
  two_factor: boolean;
  /** Staff must turn on two-factor login before the staff panel works. */
  two_factor_required: boolean;
  /** What this role may do (see backend app/deps.py). */
  permissions: Permission[];
  country: string | null;
  credit_usd: string;
  referral_code: string;
  created_at: string;
};

export type Role = "user" | "support" | "management" | "admin";
export type Permission =
  | "view"
  | "finance.view"
  | "analytics"
  | "users.manage"
  | "users.admin"
  | "tickets"
  | "finance"
  | "licensing"
  | "settings"
  | "kb"
  | "announce";

/** Sign-in answer when two-factor login is on: send the app code with this token. */
export type MfaChallenge = { mfa_required: true; mfa_token: string };
export const isMfa = (r: unknown): r is MfaChallenge => !!r && typeof r === "object" && "mfa_required" in r;

export const can = (user: User | null | undefined, permission: Permission) => !!user?.permissions.includes(permission);

export type OrderStatus = "pending" | "paid" | "failed" | "underpaid" | "refunded" | "cancelled";

export type Order = {
  id: string;
  code: string;
  kind: "new" | "renewal" | "upgrade";
  currency: string;
  list_price: string;
  discount_applied: string;
  coupon_code: string | null;
  coupon_discount: string;
  credit_applied: string;
  amount: string;
  amount_paid: string;
  status: OrderStatus;
  gateway_status: string | null;
  plan: Plan;
  invoice_url: string | null;
  failure_reason: string | null;
  paid_at: string | null;
  created_at: string;
};

/** Place in the build queue while a customer's EA file is being prepared. */
export type Queue = {
  position: number;
  ahead: number;
  /** null: no automatic compiler online right now, the team prepares the file by hand. */
  eta_seconds: number | null;
  compiler_online: boolean;
};

export type OrderStatusOut = Order & {
  shortfall: string;
  build_status: BuildStatus | null;
  queue: Queue | null;
};

export type Account = {
  id: string;
  mt5_login: number;
  broker_server: string;
  type: "live" | "demo";
  changes_used: number;
};

export type AccountInput = Omit<Account, "id" | "changes_used">;

/** An EA instance seen by the licence server. */
export type Running = {
  mt5_login: number;
  broker_server: string;
  trade_mode: "real" | "demo" | "contest";
  status: "ok" | "expired" | "wrong_account" | "revoked";
  ea_version: string | null;
  last_seen: string;
};

export type Subscription = {
  id: string;
  plan: Plan;
  starts_at: string;
  expires_at: string;
  status: "active" | "expired" | "cancelled";
  accounts: Account[];
  swaps_used: number;
  swaps_allowed: number;
  running: Running[];
};

export type BuildStatus = "queued" | "compiling" | "ready" | "downloaded" | "superseded" | "failed";

export type Build = {
  id: string;
  subscription_id: string;
  order_code: string;
  reason: string;
  status: BuildStatus;
  revoked_at: string | null;
  uploaded_at: string | null;
  downloaded_at: string | null;
  created_at: string;
  queue: Queue | null;
};

export type Dashboard = {
  user: User;
  subscriptions: Subscription[];
  builds: Build[];
  orders: Order[];
};

export type DownloadLinkOut = { url: string; expires_at: number };

export type PaymentMethods = { crypto: boolean; crypto_ready: boolean };

export type ReferralSummary = {
  code: string;
  enabled: boolean;
  tier1_percent: string;
  tier2_percent: string;
  tier1_repeat_percent: string;
  tier1_count: number;
  tier2_count: number;
  earned_usd: string;
  rewards: { tier: number; amount: string; currency: string; status: string; buyer: string; created_at: string }[];
};

export type WithdrawalStatus = "pending" | "awaiting_2fa" | "processing" | "paid" | "rejected" | "failed";

export type Withdrawal = {
  id: string;
  amount: string;
  network: "trc20" | "bep20";
  address: string;
  status: WithdrawalStatus;
  tx_hash: string | null;
  failure_reason: string | null;
  admin_note: string | null;
  created_at: string;
  paid_at: string | null;
};

export type WithdrawalsSummary = {
  available: string;
  maturing: string;
  min_withdrawal: string;
  hold_days: number;
  enabled: boolean;
  withdrawals: Withdrawal[];
};

// ---- admin ----

export type AdminBuild = Build & {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  plan_code: string;
  expires_at: string;
  accounts: Account[];
  license_key: string;
  license_data: string;
  file_name: string;
  compile_attempts: number;
  compile_log: string | null;
  download_ips: number;
  running: Running[];
};

export type AdminOrder = Order & {
  customer_email: string;
  gateway_ref: string | null;
  receipt: string | null;
};

export type AdminPlan = Plan & {
  id: number;
  active: boolean;
  sort_order: number;
  discount_percent: number;
  archived_at: string | null;
};

export type AdminStats = {
  queued_builds: number;
  failed_builds: number;
  running_eas: number;
  active_subscriptions: number;
  open_payment_issues: number;
  flagged_builds: number;
  paid_orders_30d: number;
  pending_withdrawals: number;
  open_tickets: number;
  compiler_online: boolean;
  avg_compile_seconds: number;
};

export type ReferralSettings = {
  enabled: boolean;
  tier1_percent: string;
  tier2_percent: string;
  tier1_repeat_percent: string;
  min_withdrawal_usd: string;
  hold_days: number;
};

export type AdminReferrals = {
  settings: ReferralSettings;
  referred_users: number;
  total_usd: string;
  top: { email: string; full_name: string; referral_code: string; referred: number; earned_usd: string }[];
  rewards: {
    id: number;
    order_code: string;
    tier: number;
    percent: string;
    base_amount: string;
    amount: string;
    currency: string;
    status: string;
    beneficiary_email: string;
    buyer_email: string;
    created_at: string;
  }[];
};

export type RiskFinding = { check: string; level: "pass" | "warn" | "fail"; message: string };

export type AdminWithdrawal = Withdrawal & {
  user_email: string;
  user_name: string;
  risk_score: number;
  risk_level: "ok" | "review" | "block";
  risk_report: RiskFinding[];
  provider_status: string | null;
  payout_batch_id: string | null;
  decided_at: string | null;
};

export type PaymentSettings = {
  crypto_enabled: boolean;
  nowpayments_sandbox: boolean;
  api_key_hint: string | null;
  ipn_secret_set: boolean;
  crypto_ready: boolean;
  ipn_url: string;
  sandbox_allowed: boolean;
  payout_email: string | null;
  payout_password_set: boolean;
  twofa_secret_set: boolean;
  payouts_ready: boolean;
};

export type WebhookEvent = {
  id: number;
  source: string;
  event_key: string | null;
  payload: Record<string, unknown>;
  status: string;
  error: string | null;
  received_at: string;
};

export type UserRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  country: string | null;
  role: Role;
  blocked: boolean;
  created_at: string;
  last_login_at: string | null;
  email_verified: boolean;
  two_factor: boolean;
  credit_usd: string;
  paid_orders: number;
  paid_total: string;
  active_subscriptions: number;
  referred: number;
};

export type UserDetail = UserRow & {
  blocked_reason: string | null;
  signup_ip: string | null;
  last_login_ip: string | null;
  referral_code: string;
  referred_by: string | null;
  subscriptions: Subscription[];
  orders: Order[];
  tickets: Ticket[];
  withdrawals: Withdrawal[];
  audit: { action: string; actor: string | null; details: Record<string, unknown>; created_at: string }[];
};

export type ResetLink = { sent: boolean; url: string | null };

export type StaffMember = { id: string; full_name: string; email: string; role: Role; two_factor: boolean; last_login_at: string | null };
export type RoleInfo = { role: Role; label: string; permissions: Permission[]; members: number };

export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type Ticket = {
  id: string;
  number: number;
  subject: string;
  category: "billing" | "licence" | "account" | "technical" | "other";
  status: TicketStatus;
  priority: "low" | "normal" | "high" | "urgent";
  order_code: string | null;
  created_at: string;
  updated_at: string;
  customer: string | null;
  assignee: string | null;
};
export type TicketMessage = { id: number; body: string; internal: boolean; author: string; staff: boolean; created_at: string };
export type TicketDetail = Ticket & { messages: TicketMessage[]; customer_email: string | null; customer_id: string | null };

export type Analytics = {
  days: number;
  series: { date: string; revenue: number; orders: number; signups: number }[];
  totals: {
    revenue: number;
    revenue_prev: number;
    orders: number;
    signups: number;
    conversion: number;
    paying_customers: number;
    active_subscriptions: number;
    lifetime_subscriptions: number;
    churned: number;
    renewals: number;
    arpu: number;
    referral_rewards: number;
    payouts: number;
    open_tickets: number;
    first_response_minutes: number | null;
  };
  by_plan: { plan: string; orders: number; revenue: number }[];
  by_country: { country: string; users: number; paying: number }[];
};

export type Countries = { blocked: string[]; message: string; geoip: boolean };
export type AccountRules = { require_email_verification: boolean; email_sending: boolean; staff_require_2fa: boolean };

export type InboxItem = {
  id: number;
  kind: "info" | "success" | "warning" | "danger";
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};
export type Inbox = { unread: number; items: InboxItem[] };

export type ArticleCategory = "getting-started" | "installation" | "billing" | "licence" | "troubleshooting" | "account";
export const ARTICLE_CATEGORIES: Record<ArticleCategory, string> = {
  "getting-started": "Getting started",
  installation: "Installation",
  billing: "Billing & payments",
  licence: "Licence",
  troubleshooting: "Troubleshooting",
  account: "Account & security",
};
export type Article = { slug: string; title: string; summary: string; category: ArticleCategory; updated_at: string };
export type ArticleDetail = Article & { body: string; related: Article[] };
export type AdminArticle = ArticleDetail & { id: number; published: boolean; sort_order: number; views: number; helpful_yes: number; helpful_no: number };

export type Coupon = {
  id: number;
  code: string;
  description: string;
  percent_off: number | null;
  amount_off: string | null;
  max_redemptions: number | null;
  per_user_limit: number;
  first_order_only: boolean;
  plan_ids: number[];
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  redemptions: number;
  revenue: string;
  discount_given: string;
};
export type CouponCheck = { code: string; description: string; discount: string; price: string };

export type Audience = "everyone" | "customers" | "active" | "inactive" | "staff";
export type Banner = { id: number; title: string; body: string; link: string | null; level: "info" | "success" | "warning" };
export type Announcement = Banner & {
  audience: Audience;
  banner: boolean;
  sent_inbox: boolean;
  sent_email: boolean;
  recipients: number;
  starts_at: string;
  ends_at: string | null;
  author: string | null;
  created_at: string;
  live: boolean;
};

export type Activity = {
  staff: {
    id: string;
    full_name: string;
    email: string;
    role: Role;
    two_factor: boolean;
    last_login_at: string | null;
    actions: number;
    replies: number;
    last_action_at: string | null;
  }[];
  items: {
    id: number;
    actor_id: string | null;
    actor: string | null;
    actor_role: Role | null;
    action: string;
    target_type: string;
    target_id: string;
    target_label: string | null;
    details: Record<string, unknown>;
    created_at: string;
  }[];
  total: number;
  actions: string[];
};
export type Geo = { country: string | null; blocked: boolean; message: string | null };

// ---- client ----

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) {
      return String(detail[0].msg).replace(/^Value error, /, "");
    }
  }
  return status >= 500 ? "Something went wrong — please try again" : `Request failed (${status})`;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("x-tp-csrf", "1");
  if (init.body && !(init.body instanceof FormData)) headers.set("content-type", "application/json");
  const res = await fetch(`/api${path}`, { ...init, headers, credentials: "same-origin" });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, errorMessage(body, res.status));
  return body as T;
}

export const post = <T>(path: string, data?: unknown) =>
  api<T>(path, { method: "POST", body: data === undefined ? undefined : JSON.stringify(data) });

export const put = <T>(path: string, data: unknown) =>
  api<T>(path, { method: "PUT", body: JSON.stringify(data) });

export const patch = <T>(path: string, data: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(data) });

export const del = <T>(path: string, data?: unknown) =>
  api<T>(path, { method: "DELETE", body: data === undefined ? undefined : JSON.stringify(data) });

export const fetcher = <T>(path: string) => api<T>(path);

// ---- formatting ----

/** "$1,234.50"; whole amounts without cents. */
export function usd(amount: string | number): string {
  const n = Number(amount);
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

export function daysLeft(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

/** 75 → "1 min 15 s", 3700 → "1 h 2 min". */
export function duration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ""}`;
  return `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`;
}
