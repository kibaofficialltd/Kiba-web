"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Coins, Flame, Gift, Loader2, Lock, Timer, Zap } from "lucide-react";
import type { ClaimRecord, RewardState } from "@/lib/rewards";
import { Badge } from "@/components/ui/badge";
import { FormAlert } from "@/components/ui/form";
import { Countdown } from "@/components/countdown";
import { ApiClientError, api } from "@/lib/http-client";
import { formatCoins, formatDateTime } from "@/lib/format";
import { cx } from "@/lib/cx";

export function RewardsPanel({ initial }: { initial: RewardState }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const claimedDay = state.claimedToday ? state.lastClaim : null;
  const currentDay = state.claimedToday ? null : state.nextDayNumber;

  async function claim() {
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await api<{ claim: ClaimRecord; balance: number; delivered: boolean }>(
        "/api/rewards/claim",
        { method: "POST", body: JSON.stringify({}) },
      );
      setSuccess(
        result.delivered
          ? `Day ${result.claim.dayNumber} claimed — ${formatCoins(result.claim.coins)} coins added.`
          : `Day ${result.claim.dayNumber} claimed. KIBAOFFICIALCore is delivering your items in-game.`,
      );
      setState((prev) => ({
        ...prev,
        claimedToday: true,
        currentStreak: result.claim.streak,
        nextDayNumber: (result.claim.dayNumber % Math.max(1, prev.days.length)) + 1,
        nextClaimAt: new Date(
          Date.UTC(
            new Date().getUTCFullYear(),
            new Date().getUTCMonth(),
            new Date().getUTCDate() + 1,
          ),
        ).toISOString(),
        lastClaim: result.claim,
        history: [result.claim, ...prev.history],
      }));
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not claim the reward.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel flex items-center gap-3 p-4">
          <span className="grid size-9 place-items-center rounded-lg bg-gold/10 text-gold">
            <Flame className="size-4" />
          </span>
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted">Streak</p>
            <p className="font-display text-xl">{state.currentStreak} days</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <span className="grid size-9 place-items-center rounded-lg bg-moss/10 text-moss-bright">
            <Gift className="size-4" />
          </span>
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted">Next reward</p>
            <p className="font-display text-xl">Day {state.nextDayNumber}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <span className="grid size-9 place-items-center rounded-lg bg-sky/10 text-sky">
            <Timer className="size-4" />
          </span>
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted">
              {state.claimedToday ? "Resets in" : "Available"}
            </p>
            <p className="font-display text-xl">
              {state.nextClaimAt ? <Countdown target={state.nextClaimAt} compact /> : "Now"}
            </p>
          </div>
        </div>
      </div>

      {!state.linked ? (
        <FormAlert message="Link your Minecraft account to claim rewards — items are delivered in-game." />
      ) : null}

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-line/70 px-5 py-3.5">
          <span className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-parchment">
            Seven-day cycle
          </span>
          <span className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">
            Resets 00:00 UTC
          </span>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {state.days.map((day) => {
            const isClaimed = Boolean(claimedDay && claimedDay.dayNumber === day.dayNumber);
            const isCurrent = currentDay === day.dayNumber;
            const passed =
              !state.claimedToday && state.currentStreak > 0 && day.dayNumber < state.nextDayNumber;

            return (
              <div
                key={day.id}
                className={cx(
                  "relative flex flex-col rounded-xl border p-4 transition",
                  isCurrent
                    ? "border-gold/50 bg-gold/[0.06] shadow-[0_0_0_1px_rgba(201,169,97,0.1)]"
                    : isClaimed
                      ? "border-moss/35 bg-moss/[0.05]"
                      : "border-line bg-ink/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted">
                    Day {day.dayNumber}
                  </span>
                  {isClaimed ? (
                    <Check className="size-3.5 text-moss-bright" />
                  ) : isCurrent ? (
                    <Badge tone="gold">Today</Badge>
                  ) : passed ? (
                    <Check className="size-3.5 text-moss/50" />
                  ) : (
                    <Lock className="size-3 text-muted/50" />
                  )}
                </div>
                <p className="mt-2 font-display text-base leading-snug">{day.title}</p>
                <p className="mt-1 line-clamp-2 text-[0.7rem] leading-relaxed text-muted">
                  {day.description}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-[0.66rem]">
                  {day.coins > 0 ? (
                    <span className="inline-flex items-center gap-1 text-gold-bright">
                      <Coins className="size-3" /> {formatCoins(day.coins)}
                    </span>
                  ) : null}
                  {day.commands.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-moss">
                      <Zap className="size-3" /> in-game
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-line/70 p-5">
          <FormAlert message={error} />
          {success ? <FormAlert tone="success" message={success} /> : null}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {state.claimedToday
                ? `Claimed today. Come back in ${state.nextClaimAt ? "less than 24 hours" : "24 hours"}.`
                : `Day ${state.nextDayNumber} is ready — ${formatCoins(
                    state.days.find((d) => d.dayNumber === state.nextDayNumber)?.coins ?? 0,
                  )} coins plus in-game items.`}
            </p>
            <button
              type="button"
              onClick={claim}
              disabled={pending || state.claimedToday || !state.linked}
              className="btn btn-gold"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Gift className="size-4" />}
              {state.claimedToday ? "Claimed today" : "Claim daily reward"}
            </button>
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-line/70 px-5 py-3.5">
          <span className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-parchment">
            Claim history
          </span>
        </div>
        {state.history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">No claims yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Streak</th>
                  <th>Coins</th>
                  <th>Status</th>
                  <th>Claimed</th>
                </tr>
              </thead>
              <tbody>
                {state.history.map((claim) => (
                  <tr key={claim.id}>
                    <td>Day {claim.dayNumber}</td>
                    <td>{claim.streak}</td>
                    <td className="text-gold-bright">{formatCoins(claim.coins)}</td>
                    <td>
                      <Badge
                        tone={
                          claim.status === "delivered" ? "moss" : claim.status === "pending" ? "gold" : "ember"
                        }
                      >
                        {claim.status}
                      </Badge>
                    </td>
                    <td className="text-muted">{formatDateTime(claim.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
