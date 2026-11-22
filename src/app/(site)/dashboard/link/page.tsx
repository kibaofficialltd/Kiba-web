import type { Metadata } from "next";
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
