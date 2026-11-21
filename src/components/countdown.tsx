"use client";

import { useEffect, useState } from "react";

function diff(target: string) {
  const ms = new Date(target).getTime() - Date.now();
  const clamp = Math.max(0, ms);
  return {
    days: Math.floor(clamp / 86_400_000),
    hours: Math.floor((clamp % 86_400_000) / 3_600_000),
    minutes: Math.floor((clamp % 3_600_000) / 60_000),
    seconds: Math.floor((clamp % 60_000) / 1000),
    over: ms <= 0,
  };
}

export function Countdown({
  target,
  compact = false,
  labels = true,
}: {
  target: string;
  compact?: boolean;
  labels?: boolean;
}) {
  const [time, setTime] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    setTime(diff(target));
    const id = window.setInterval(() => setTime(diff(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const parts = [
    { value: time?.days ?? 0, label: "days" },
    { value: time?.hours ?? 0, label: "hrs" },
    { value: time?.minutes ?? 0, label: "min" },
    { value: time?.seconds ?? 0, label: "sec" },
  ];

  if (compact) {
    return (
      <span className="font-mono text-xs tabular-nums text-parchment-dim">
        {time ? (time.over ? "Started" : `${parts[0].value}d ${parts[1].value}h ${parts[2].value}m`) : "—"}
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      {parts.map((part) => (
        <div key={part.label} className="min-w-12 rounded-lg border border-line bg-ink/50 px-2 py-1.5 text-center">
          <div className="font-mono text-lg tabular-nums text-parchment">
            {time ? String(part.value).padStart(2, "0") : "––"}
          </div>
          {labels ? (
            <div className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-muted">
              {part.label}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
