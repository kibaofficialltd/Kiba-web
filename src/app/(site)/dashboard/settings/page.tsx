import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { getLinkedAccount } from "@/lib/minecraft";
import { formatDate } from "@/lib/format";
import { ChangePasswordForm, ResendVerification, SignOutEverywhere } from "./settings-forms";

export const metadata: Metadata = { title: "Account settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const account = await getLinkedAccount(user.id);

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow mb-2">Settings</p>
        <h1 className="display-md">Your account, your controls.</h1>
        <p className="mt-1 text-sm text-muted">
          Passwords are hashed with scrypt. We never store a plaintext copy and staff can never read
          your password.
        </p>
      </header>

      <section className="panel overflow-hidden">
        <div className="border-b border-line/70 px-5 py-3.5">
          <h2 className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
            Identity
          </h2>
        </div>
        <dl className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <dt className="text-[0.58rem] uppercase tracking-[0.16em] text-muted">Username</dt>
            <dd className="mt-0.5 font-display text-lg text-parchment">{user.username}</dd>
          </div>
          <div>
            <dt className="text-[0.58rem] uppercase tracking-[0.16em] text-muted">Email</dt>
            <dd className="mt-0.5 break-all text-sm text-parchment-dim">{user.email}</dd>
          </div>
          <div>
            <dt className="text-[0.58rem] uppercase tracking-[0.16em] text-muted">Role</dt>
            <dd className="mt-0.5">
              <Badge tone={user.role === "player" ? "default" : "gold"}>{user.role}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-[0.58rem] uppercase tracking-[0.16em] text-muted">Joined</dt>
            <dd className="mt-0.5 text-sm text-parchment-dim">{formatDate(user.createdAt)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[0.58rem] uppercase tracking-[0.16em] text-muted">Email status</dt>
            <dd className="mt-1">
              <ResendVerification verified={Boolean(user.emailVerifiedAt)} />
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[0.58rem] uppercase tracking-[0.16em] text-muted">Minecraft</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              {account ? (
                <>
                  <Badge tone={account.edition === "java" ? "sky" : "moss"}>{account.edition}</Badge>
                  <span className="text-parchment">{account.username}</span>
                  <Link href="/dashboard/link" className="text-xs text-muted underline underline-offset-2 hover:text-parchment">
                    Manage link
                  </Link>
                </>
              ) : (
                <>
                  <span className="text-muted">Not linked</span>
                  <Link href="/dashboard/link" className="btn btn-ghost btn-sm">
                    Link now
                  </Link>
                </>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-line/70 px-5 py-3.5">
          <h2 className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
            Password
          </h2>
        </div>
        <div className="p-5">
          <ChangePasswordForm />
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-lg">Session</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          This device holds an HTTP-only session cookie. Changing your password signs out every
          other device automatically.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <SignOutEverywhere />
          <Link href="/forgot-password" className="btn btn-quiet btn-sm">
            Reset via email
          </Link>
        </div>
      </section>

      <section className="panel border-ember/20 p-5">
        <h2 className="font-display text-lg text-[#f0a49d]">Something looks wrong?</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          If you see activity you do not recognise, change your password immediately and open a
          high-priority support ticket. Staff will never ask for your password.
        </p>
        <Link href="/support" className="btn btn-ghost btn-sm mt-3">
          Open a ticket
        </Link>
      </section>
    </div>
  );
}
