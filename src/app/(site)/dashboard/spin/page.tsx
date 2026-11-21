import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getSpinState } from "@/lib/spin";
import { SpinPanel } from "./spin-panel";

export const metadata: Metadata = { title: "Daily spin" };
export const dynamic = "force-dynamic";

export default async function SpinPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const state = await getSpinState(user.id);

  return (
    <div>
      <header className="mb-6">
        <p className="eyebrow mb-2">Daily spin</p>
        <h1 className="display-md">Fortune favours the present.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          One free spin every UTC day. The outcome is generated server-side with a cryptographic
          random source before the wheel moves — the animation is only a reveal.
        </p>
      </header>

      <SpinPanel initial={state} />
    </div>
  );
}
