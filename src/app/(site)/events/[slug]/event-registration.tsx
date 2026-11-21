"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, LogIn, Loader2, UserPlus, XCircle } from "lucide-react";
import { ApiClientError, api } from "@/lib/http-client";
import { FormAlert } from "@/components/ui/form";

export function EventRegistration({
  slug,
  signedIn,
  registered: initialRegistered,
  open,
}: {
  slug: string;
  signedIn: boolean;
  registered: boolean;
  open: boolean;
}) {
  const router = useRouter();
  const [registered, setRegistered] = useState(initialRegistered);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setPending(true);
    setError(null);
    try {
      if (registered) {
        await api(`/api/events/${slug}/register`, { method: "DELETE" });
        setRegistered(false);
      } else {
        await api(`/api/events/${slug}/register`, { method: "POST", body: JSON.stringify({}) });
        setRegistered(true);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not update your registration.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <div className="space-y-2">
        <button type="button" disabled className="btn btn-quiet btn-block">
          Registration closed
        </button>
        {registered ? (
          <p className="flex items-center gap-1.5 text-xs text-moss-bright">
            <CheckCircle2 className="size-3.5" /> You were registered for this event.
          </p>
        ) : null}
      </div>
    );
  }

  if (!signedIn) {
    return (
      <Link href={`/login?next=/events/${slug}`} className="btn btn-primary btn-block">
        <LogIn className="size-4" /> Sign in to register
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <FormAlert message={error} />
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={registered ? "btn btn-ghost btn-block" : "btn btn-primary btn-block"}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : registered ? (
          <XCircle className="size-4" />
        ) : (
          <UserPlus className="size-4" />
        )}
        {registered ? "Cancel registration" : "Register for this event"}
      </button>
      {registered ? (
        <p className="flex items-center gap-1.5 text-xs text-moss-bright">
          <CheckCircle2 className="size-3.5" /> You are on the list.
        </p>
      ) : null}
    </div>
  );
}
