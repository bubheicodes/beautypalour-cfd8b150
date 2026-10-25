"use client";

import { KeyRound, LogOut, Mail, MailCheck, MailWarning, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";

import { Reveal } from "@/components/motion";
import { TwoFactorCard, YourData } from "@/components/security";
import { ErrorNote, Loading, PageHeader, Section, Spinner } from "@/components/ui";
import { patch, post, put, shortDate, type User } from "@/lib/api";
import { countryOptions } from "@/lib/countries";
import { useMe } from "@/lib/hooks";

export default function AccountPage() {
  const { user, mutate } = useMe();
  const router = useRouter();
  const countries = useMemo(() => countryOptions(), []);
  if (!user) return <Loading />;

  const saved = (u: User) => mutate(u, { revalidate: false });

  return (
    <>
      <PageHeader title="Account" description="Your profile, sign-in details and security." />
      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Reveal>
          <Section title="Profile" description="Used on your invoices and for renewal SMS.">
            <FormCard
              icon={UserRound}
              submit="Save profile"
              onSubmit={async (fd) =>
                saved(await patch<User>("/me/profile", { first_name: fd.get("first_name"), last_name: fd.get("last_name"), phone: fd.get("phone"), country: fd.get("country") || null }))
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="a-first">First name</label>
                  <input id="a-first" name="first_name" className="input" defaultValue={user.first_name} required maxLength={60} autoComplete="given-name" />
                </div>
                <div>
                  <label className="label" htmlFor="a-last">Last name</label>
                  <input id="a-last" name="last_name" className="input" defaultValue={user.last_name} required maxLength={60} autoComplete="family-name" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="a-phone">Phone</label>
                  <input id="a-phone" name="phone" className="input num" defaultValue={user.phone.startsWith("254") ? `0${user.phone.slice(3)}` : user.phone} required />
                </div>
                <div>
                  <label className="label" htmlFor="a-country">Country</label>
                  <select id="a-country" name="country" className="input" defaultValue={user.country ?? ""}>
                    <option value="">—</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </FormCard>
          </Section>
        </Reveal>

        <Reveal delay={0.05}>
          <Section title="Email address" description={`Currently ${user.email}. We'll tell your old address about the change.`}>
            <EmailStatus user={user} />
            <FormCard icon={Mail} submit="Change email" onSubmit={async (fd) => saved(await put<User>("/me/email", { email: fd.get("email"), password: fd.get("password") }))}>
              <div>
                <label className="label" htmlFor="a-email">New email</label>
                <input id="a-email" name="email" type="email" className="input" required autoComplete="email" />
              </div>
              <div>
                <label className="label" htmlFor="a-email-pw">Your password</label>
                <input id="a-email-pw" name="password" type="password" className="input" required autoComplete="current-password" />
              </div>
            </FormCard>
          </Section>
        </Reveal>

        <Reveal delay={0.1}>
          <Section title="Password" description="Changing it signs out your other devices.">
            <FormCard
              icon={KeyRound}
              submit="Change password"
              onSubmit={async (fd) => {
                if (fd.get("new_password") !== fd.get("confirm")) throw new Error("The two new passwords don't match");
                saved(await post<User>("/me/password", { current_password: fd.get("current_password"), new_password: fd.get("new_password") }));
              }}
            >
              <div>
                <label className="label" htmlFor="a-cur">Current password</label>
                <input id="a-cur" name="current_password" type="password" className="input" required autoComplete="current-password" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="a-new">New password</label>
                  <input id="a-new" name="new_password" type="password" className="input" required minLength={10} autoComplete="new-password" />
                </div>
                <div>
                  <label className="label" htmlFor="a-confirm">Repeat</label>
                  <input id="a-confirm" name="confirm" type="password" className="input" required minLength={10} autoComplete="new-password" />
                </div>
              </div>
            </FormCard>
          </Section>
        </Reveal>

        <Reveal delay={0.12}>
          <Section title="Two-factor login" description="Security for your sign-ins." id="security">
            <TwoFactorCard user={user} onChange={() => mutate()} />
          </Section>
        </Reveal>

        <Reveal delay={0.15}>
          <Section title="Sessions" description="Lost a device, or signed in somewhere public? Sign out everywhere, including here.">
            <button
              className="btn-danger"
              onClick={async () => {
                if (!window.confirm("Sign out of TradePilot on every device?")) return;
                await post("/auth/logout-all");
                await mutate(undefined, { revalidate: true });
                router.push("/login");
              }}
            >
              <LogOut className="h-4 w-4" /> Sign out everywhere
            </button>
            <p className="mt-4 text-xs text-ink-400">Member since {shortDate(user.created_at)}</p>
          </Section>
        </Reveal>

        <Reveal delay={0.18} className="lg:col-span-2">
          <Section title="Your data" description="Take a copy of your data, or close your account.">
            <YourData user={user} onDeleted={() => mutate(undefined, { revalidate: false })} />
          </Section>
        </Reveal>
      </div>
    </>
  );
}

function EmailStatus({ user }: { user: User }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | string>("idle");
  if (user.email_verified_at) {
    return (
      <p className="mb-4 flex items-center gap-2 text-sm text-ok">
        <MailCheck className="h-4 w-4" /> Confirmed
      </p>
    );
  }
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber/25 bg-amber/[0.07] px-3 py-2.5 text-sm">
      <MailWarning className="h-4 w-4 text-amber" />
      <span className="flex-1 text-ink-200">Not confirmed yet — check your inbox for our link.</span>
      {state === "sent" ? (
        <span className="text-ok">Sent</span>
      ) : (
        <button
          className="font-medium text-brand-light hover:underline disabled:opacity-50"
          disabled={state === "sending"}
          onClick={() => {
            setState("sending");
            post("/me/verify-email/resend")
              .then(() => setState("sent"))
              .catch((e: Error) => setState(e.message));
          }}
        >
          Resend link
        </button>
      )}
      {state !== "idle" && state !== "sending" && state !== "sent" && <span className="w-full text-xs text-loss">{state}</span>}
    </div>
  );
}

function FormCard({
  icon: Icon,
  submit,
  onSubmit,
  children,
}: {
  icon: typeof UserRound;
  submit: string;
  onSubmit: (fd: FormData) => Promise<unknown>;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await onSubmit(new FormData(form));
      setMsg("Saved");
      form.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach((i) => (i.value = ""));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" disabled={busy}>
          {busy ? <Spinner /> : <Icon className="h-4 w-4" />} {submit}
        </button>
        {msg && <span className="text-sm text-ok">{msg}</span>}
      </div>
      <ErrorNote message={error} />
    </form>
  );
}
