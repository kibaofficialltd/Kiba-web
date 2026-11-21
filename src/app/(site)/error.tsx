"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[kiba] site error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="size-10 text-amber-400" />
      <h1 className="text-2xl font-semibold text-white">Temporarily unavailable</h1>
      <p className="max-w-md text-sm text-zinc-400">
        We couldn&apos;t load this page right now (the database may be restarting).
        Please try again in a few seconds.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
      >
        <RefreshCw className="size-4" /> Retry
      </button>
    </div>
  );
}
