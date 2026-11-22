"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Copy, Link2, Loader2, ShieldCheck, Unlink } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/field";
import { FormAlert, SubmitButton } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";
import { formatDate, relativeTime } from "@/lib/format";
import { Countdown } from "@/components/countdown";

export type LinkAccountView = {
  username: string;
  uuid: string;
  edition: "java" | "bedrock";
  linkedAt: string;
  lastSeenAt: string | null;
} | null;

type StatusResponse = {
  linked: boolean;
  account: LinkAccountView;
  pendingCode: { code: string; expiresAt: string } | null;
};

export function LinkPanel({
  initialAccount,
  initialCode,
  emailVerified,
}: {
  initialAccount: LinkAccountView;
  initialCode: { code: string; expiresAt: string } | null;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const [account, setAccount] = useState<LinkAccountView>(initialAccount);
  const [code, setCode] = useState(initialCode);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [showUnlink, setShowUnlink] = useState(false);
  const [checking, setChecking] = useState(false);
  const pollRef = useRef<number | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      setChecking(true);
      const data = await api<StatusResponse>("/api/minecraft/link");
      if (data.linked) {
        setAccount(data.account);
        setCode(null);
        if (pollRef.current) window.clearInterval(pollRef.current);
        router.refresh();
      } else if (data.pendingCode) {
        setCode(data.pendingCode);
      }
    } catch {
      // silent — polling will retry
    } finally {
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    if (!code || account) return;
    pollRef.current = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshStatus();
    }, 5000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [code, account, refreshStatus]);

  async function generate() {
    setPending(true);
    setError(null);
    try {
      const data = await api<{ code: string; expiresAt: string }>("/api/minecraft/link", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setCode({ code: data.code, expiresAt: data.expiresAt });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not generate a code.");
    } finally {
      setPending(false);
    }
  }

  async function copyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(`/link ${code.code}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function unlink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUnlinking(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/minecraft/unlink", {
        method: "POST",
        body: JSON.stringify({ password: String(form.get("password") ?? "") }),
      });
      setAccount(null);
      setShowUnlink(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not unlink this account.");
    } finally {
      setUnlinking(false);
    }
  }

  if (account) {
    return (
      <div className="space-y-5">
        <section className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-5 py-3.5">
            <span className="flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-moss-bright">
              <ShieldCheck className="size-4" /> Verified link
            </span>
            <Badge tone={account.edition === "java" ? "sky" : "moss"}>
              {account.edition} edition
            </Badge>
          </div>

          <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center">
            <Avatar name={account.username} size={80} className="rounded-xl" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl text-parchment">{account.username}</h2>
              <p className="mt-1 break-all font-mono text-xs text-muted">{account.uuid}</p>
              <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <dt className="text-[0.6rem] uppercase tracking-[0.16em] text-muted">Linked</dt>
                  <dd className="mt-0.5 text-parchment-dim">{formatDate(account.linkedAt)}</dd>
                </div>
                <div>
                  <dt className="text-[0.6rem] uppercase tracking-[0.16em] text-muted">Last seen</dt>
                  <dd className="mt-0.5 text-parchment-dim">{relativeTime(account.lastSeenAt)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="border-t border-line/70 bg-moss/[0.03] px-5 py-3 text-xs text-muted">
            Rewards and purchases are delivered to this UUID only. Usernames can change — the UUID
            is the identity.
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/dashboard/rewards" className="panel panel-interactive p-5">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-moss">Unlocked</p>
            <p className="mt-1 font-display text-lg">Daily rewards</p>
            <p className="mt-1 text-xs text-muted">Claim your streak before the UTC reset.</p>
          </Link>
          <Link href="/store" className="panel panel-interactive p-5">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-gold">Unlocked</p>
            <p className="mt-1 font-display text-lg">Coin store</p>
            <p className="mt-1 text-xs text-muted">Ranks, keys and cosmetics delivered in-game.</p>
          </Link>
        </div>

        <section className="panel p-5">
          <h3 className="font-display text-lg">Unlink account</h3>
          <p className="mt-1 text-xs text-muted">
            Unlinking stops all deliveries. Your coin balance and history stay on your portal
            account. You can link a different profile afterwards.
          </p>

          <FormAlert message={error} />

          {showUnlink ? (
            <form onSubmit={unlink} className="mt-4 max-w-sm space-y-3">
              <Field label="Confirm your password" htmlFor="unlink-password">
                <Input id="unlink-password" name="password" type="password" autoComplete="current-password" required />
              </Field>
              <div className="flex gap-2">
                <ButtonDanger pending={unlinking} />
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => setShowUnlink(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className="btn btn-danger btn-sm mt-4" onClick={() => setShowUnlink(true)}>
              <Unlink className="size-3.5" /> Unlink Minecraft
            </button>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="panel overflow-hidden">
        <div className="border-b border-line/70 px-5 py-3.5">
          <span className="flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-parchment">
            <Link2 className="size-4 text-moss" /> Identity verification
          </span>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5 p-5">
            <Step number="01" title="Generate a one-time code" active={!code}>
              Codes expire after 15 minutes and can only be redeemed once.
            </Step>
            <Step number="02" title="Join KIBAOFFICIAL SMP" active={Boolean(code)}>
              Connect with Java or Bedrock. Cracked clients are supported — the server resolves
              your UUID on its side.
            </Step>
            <Step number="03" title="Run the link command in-game" active={Boolean(code)}>
              Type <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[0.78em]">{code ? `/link ${code.code}` : "/link CODE"}</code>{" "}
              in chat. The core plugin confirms your UUID to this website.
            </Step>

            {error ? <FormAlert message={error} /> : null}

            {!code ? (
              <SubmitButton pending={pending} onClick={generate} type="button" className="btn-block" disabled={pending}>
                {pending ? "Generating" : "Generate link code"}
              </SubmitButton>
            ) : (
              <button type="button" onClick={generate} className="btn btn-quiet btn-sm" disabled={pending}>
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : null} Generate a new code
              </button>
            )}
          </div>

          <div className="border-t border-line/70 bg-ink/40 p-5 md:border-l md:border-t-0">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted">
              Your code
            </p>

            {code ? (
              <>
                <div className="mt-3 rounded-xl border border-dashed border-moss/40 bg-moss/[0.06] p-5 text-center">
                  <p className="font-mono text-3xl tracking-[0.18em] text-moss-bright">{code.code}</p>
                  <p className="mt-2 text-[0.62rem] uppercase tracking-[0.16em] text-muted">
                    expires in <Countdown target={code.expiresAt} compact />
                  </p>
                </div>
                <button type="button" onClick={copyCode} className="btn btn-ghost btn-sm mt-3 w-full">
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied command" : "Copy /link command"}
                </button>
                <p className="mt-4 flex items-center gap-2 text-[0.68rem] text-muted">
                  {checking ? <Loader2 className="size-3 animate-spin" /> : <span className="live-dot !size-1.5" />}
                  Waiting for the server to confirm…
                </p>
              </>
            ) : (
              <div className="mt-3 grid place-items-center rounded-xl border border-dashed border-line px-4 py-8 text-center">
                <p className="font-mono text-2xl tracking-[0.2em] text-muted/50">••••-••••</p>
                <p className="mt-2 text-xs text-muted">Generate a code to begin.</p>
              </div>
            )}

            <div className="mt-6 space-y-2 text-[0.68rem] leading-relaxed text-muted">
              <p className="font-semibold uppercase tracking-[0.14em] text-parchment-dim">Why UUIDs?</p>
              <p>
                Usernames can be changed or imitated. KIBAOFFICIALCore reports the UUID it resolved
                during login, so rewards can only reach the real account.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <h3 className="font-display text-base">Playing on Bedrock?</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Join with the Bedrock address shown on the homepage, then run the same{" "}
          <code className="rounded bg-white/5 px-1 py-0.5 font-mono">/link CODE</code> command.
          Floodgate forwards your XUID and the plugin records the Bedrock edition automatically.
        </p>
      </section>
    </div>
  );
}

function Step({
  number,
  title,
  active,
  children,
}: {
  number: string;
  title: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span
        className={
          active
            ? "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-moss/50 bg-moss/10 font-mono text-[0.62rem] text-moss-bright"
            : "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-line font-mono text-[0.62rem] text-muted"
        }
      >
        {number}
      </span>
      <div>
        <p className="text-sm font-semibold text-parchment">{title}</p>
        <div className="mt-1 text-xs leading-relaxed text-muted">{children}</div>
      </div>
    </div>
  );
}

function ButtonDanger({ pending }: { pending: boolean }) {
  return (
    <button type="submit" className="btn btn-danger btn-sm" disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Unlink className="size-3.5" />}
      Unlink
    </button>
  );
}
