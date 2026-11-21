"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-semibold">KIBAOFFICIAL SMP</h1>
          <p className="max-w-md text-sm text-zinc-400">
            A critical error occurred. Please refresh the page.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
