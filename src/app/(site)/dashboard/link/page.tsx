import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getLinkedAccount, latestLinkCode } from "@/lib/minecraft";
import { LinkPanel } from "./link-panel";

export const metadata: Metadata = { title: "Minecraft linking" };
export const dynamic = "force-dynamic";

export default async function LinkPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [account, pending] = await Promise.all([
    getLinkedAccount(user.id),
    latestLinkCode(user.id),
  ]);

  return (
    <div>
      <header className="mb-6">
        <p className="eyebrow mb-2">Minecraft identity</p>
        <h1 className="display-md">Link your account.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          A verified link proves which UUID is yours. It is required for daily rewards,
          purchases and leaderboard placement.
        </p>
      </header>

      <div className="mb-6 rounded-2xl border border-gold/30 bg-gold/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-parchment flex items-center gap-2">
            <BookOpen className="size-4 text-gold" /> Need help linking?
          </p>
          <p className="text-xs text-muted">
            Check our illustrated step-by-step tutorial with screenshots to link your account in under 1 minute.
          </p>
        </div>
        <Link
          href="/guide/how-to-link-minecraft"
          className="btn btn-gold btn-sm shrink-0 inline-flex items-center gap-1.5"
        >
          View Visual Guide →
        </Link>
      </div>

      <LinkPanel
        initialAccount={
          account
            ? {
                username: account.username,
                uuid: account.uuid,
                edition: account.edition,
                linkedAt: account.linkedAt.toISOString(),
                lastSeenAt: account.lastSeenAt ? account.lastSeenAt.toISOString() : null,
              }
            : null
        }
        initialCode={
          pending && pending.expiresAt > new Date()
            ? { code: pending.code, expiresAt: pending.expiresAt.toISOString() }
            : null
        }
        emailVerified={true}
      />
    </div>
  );
}
