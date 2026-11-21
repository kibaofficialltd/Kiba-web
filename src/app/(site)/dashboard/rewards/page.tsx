import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getRewardState } from "@/lib/rewards";
import { RewardsPanel } from "./rewards-panel";

export const metadata: Metadata = { title: "Daily rewards" };
export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const state = await getRewardState(user.id);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Daily rewards</p>
          <h1 className="display-md">Show up. Claim. Repeat.</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Seven days of rewards on a rolling streak. Claim windows reset at 00:00 UTC and every
            claim is validated on the server before coins or items move.
          </p>
        </div>
        <Link href="/dashboard/spin" className="btn btn-ghost btn-sm">
          Daily spin <ArrowRight className="size-3.5" />
        </Link>
      </header>

      <RewardsPanel initial={state} />
    </div>
  );
}
