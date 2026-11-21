"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Dices, Loader2, Sparkles, Timer } from "lucide-react";
import type { SpinState } from "@/lib/spin";
import { Badge } from "@/components/ui/badge";
import { FormAlert } from "@/components/ui/form";
import { Countdown } from "@/components/countdown";
import { ApiClientError, api } from "@/lib/http-client";
import { formatCoins, formatDateTime } from "@/lib/format";

type SpinResponse = {
  prize: { id: string; label: string; coins: number; rarity: string; color: string };
  index: number;
  balance: number;
};

const R = 100;
const CX = 110;
const CY = 110;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function SpinPanel({ initial }: { initial: SpinState }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpinResponse["prize"] | null>(null);

  const prizes = state.prizes;
  const seg = prizes.length > 0 ? 360 / prizes.length : 360;

  useEffect(() => {
    if (!pending) return;
    const timeout = window.setTimeout(() => setPending(false), 200);
    return () => window.clearTimeout(timeout);
  }, [pending]);

  async function spin() {
    if (spinning || pending || !state.canSpin) return;
    setSpinning(true);
    setError(null);
    setResult(null);

    try {
      const data = await api<SpinResponse>("/api/spin/claim", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const offset = (360 - (data.index * seg + seg / 2) + 360) % 360;
      const turns = Math.ceil(rotation / 360) * 360 + 360 * 5;
      setRotation(turns + offset);

      window.setTimeout(() => {
        setResult(data.prize);
        setSpinning(false);
        setState((prev) => ({
          ...prev,
          canSpin: false,
          nextSpinAt: new Date(
            Date.UTC(
              new Date().getUTCFullYear(),
              new Date().getUTCMonth(),
              new Date().getUTCDate() + 1,
            ),
          ).toISOString(),
          history: [
            {
              id: crypto.randomUUID(),
              prizeLabel: data.prize.label,
              coins: data.prize.coins,
              createdAt: new Date().toISOString(),
            },
            ...prev.history,
          ],
        }));
        router.refresh();
      }, 4700);
    } catch (err) {
      setSpinning(false);
      setError(err instanceof ApiClientError ? err.message : "The wheel could not spin.");
    }
  }

  const totalWeight = Math.max(1, state.totalWeight);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="panel grain relative flex flex-col items-center overflow-hidden px-4 py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(201,169,97,0.12),transparent_60%)]" />

        <div className="relative mb-6 flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted">
          <Sparkles className="size-3.5 text-gold" />
          {state.canSpin ? "One free spin available" : "Next spin tomorrow"}
        </div>

        {/* Pointer */}
        <div className="relative" style={{ width: 260, height: 260 }}>
          <div className="absolute left-1/2 top-[-6px] z-20 -translate-x-1/2">
            <div className="h-0 w-0 border-x-[8px] border-t-[14px] border-x-transparent border-t-gold-bright drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
          </div>

          <div className="absolute inset-0 rounded-full border border-gold/25 shadow-[0_0_60px_-18px_rgba(201,169,97,0.35)]" />

          <div
            className="wheel-spin absolute inset-[6px]"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: spinning ? "4600ms" : "0ms",
            }}
          >
            <svg viewBox="0 0 220 220" className="size-full">
              <defs>
                <radialGradient id="hub" cx="50%" cy="35%">
                  <stop offset="0" stopColor="#1d2b22" />
                  <stop offset="1" stopColor="#080d0a" />
                </radialGradient>
              </defs>
              {prizes.map((prize, index) => {
                const start = -90 + index * seg;
                const end = start + seg;
                const p1 = polar(CX, CY, R, start);
                const p2 = polar(CX, CY, R, end);
                const mid = start + seg / 2;
                const labelPos = polar(CX, CY, 64, mid);
                return (
                  <g key={prize.id}>
                    <path
                      d={`M${CX},${CY} L${p1.x},${p1.y} A${R},${R} 0 ${seg > 180 ? 1 : 0},1 ${p2.x},${p2.y} Z`}
                      fill={prize.color}
                      fillOpacity={0.28}
                      stroke="rgba(233,228,216,0.1)"
                      strokeWidth="0.6"
                    />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      fill="#e9e4d8"
                      fontSize="6.4"
                      fontWeight="700"
                      textAnchor="middle"
                      transform={`rotate(${mid + 90} ${labelPos.x} ${labelPos.y})`}
                      style={{ letterSpacing: "0.02em" }}
                    >
                      {prize.label.length > 14 ? `${prize.label.slice(0, 13)}…` : prize.label}
                    </text>
                  </g>
                );
              })}
              <circle cx={CX} cy={CY} r="24" fill="url(#hub)" stroke="rgba(201,169,97,0.45)" strokeWidth="1" />
              <circle cx={CX} cy={CY} r="30" fill="none" stroke="rgba(233,228,216,0.08)" strokeWidth="0.8" />
              <text x={CX} y={CY + 2.5} fill="#c9a961" fontSize="8" textAnchor="middle" fontFamily="Cinzel, serif">
                KIBA
              </text>
            </svg>
          </div>
        </div>

        <div className="relative mt-8 w-full max-w-xs">
          {error ? <FormAlert message={error} /> : null}

          {result && !spinning ? (
            <div className="mb-4 rounded-xl border border-gold/35 bg-gold/[0.07] p-4 text-center" aria-live="polite">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gold">You won</p>
              <p className="mt-1 font-display text-xl text-parchment">{result.label}</p>
              <p className="mt-0.5 text-xs text-muted">
                +{formatCoins(result.coins)} coins credited to your balance
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={spin}
            disabled={!state.canSpin || spinning || pending || !state.linked}
            className="btn btn-gold btn-lg btn-block"
          >
            {spinning || pending ? <Loader2 className="size-4 animate-spin" /> : <Dices className="size-4" />}
            {spinning ? "Spinning…" : state.canSpin ? "Spin the wheel" : "Spun today"}
          </button>

          {!state.canSpin && state.nextSpinAt ? (
            <p className="mt-3 flex items-center justify-center gap-2 text-[0.68rem] text-muted">
              <Timer className="size-3" /> Next spin in <Countdown target={state.nextSpinAt} compact />
            </p>
          ) : null}
          {!state.linked ? (
            <p className="mt-3 text-center text-[0.68rem] text-ember">
              Link your Minecraft account to unlock the wheel.
            </p>
          ) : null}
        </div>
      </section>

      <div className="space-y-4">
        <section className="panel overflow-hidden">
          <div className="border-b border-line/70 px-4 py-3">
            <h2 className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
              Prizes & odds
            </h2>
          </div>
          <ul className="divide-y divide-line/50">
            {prizes.map((prize) => (
              <li key={prize.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                <span className="flex items-center gap-2 text-sm">
                  <span
                    className="size-2 rounded-sm"
                    style={{ backgroundColor: prize.color }}
                    aria-hidden="true"
                  />
                  {prize.label}
                </span>
                <span className="flex items-center gap-2">
                  <Badge
                    tone={
                      prize.rarity === "legendary"
                        ? "gold"
                        : prize.rarity === "epic"
                          ? "ember"
                          : prize.rarity === "rare"
                            ? "sky"
                            : "default"
                    }
                  >
                    {((prize.weight / totalWeight) * 100).toFixed(prize.rarity === "legendary" ? 1 : 0)}%
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-line/70 px-4 py-3">
            <h2 className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
              Recent spins
            </h2>
          </div>
          {state.history.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted">No spins yet.</p>
          ) : (
            <ul className="divide-y divide-line/50">
              {state.history.slice(0, 6).map((spin) => (
                <li key={spin.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs">
                  <span className="truncate text-parchment-dim">{spin.prizeLabel}</span>
                  <span className="flex items-center gap-1 text-gold">
                    <Coins className="size-3" /> {formatCoins(spin.coins)}
                  </span>
                  <span className="hidden text-[0.6rem] text-muted sm:inline">
                    {formatDateTime(spin.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
