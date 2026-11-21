"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/http-client";
import { Spinner } from "@/components/ui/form";

export function VerifyEmailClient({ token }: { token: string | null }) {
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("This link is missing its verification token.");
      return;
    }
    if (ran.current) return;
    ran.current = true;
    setState("pending");
    api("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) })
      .then(() => setState("done"))
      .catch((error: Error) => {
        setState("error");
        setMessage(error.message);
      });
  }, [token]);

  if (state === "pending" || state === "idle") {
    return (
      <div className="panel flex items-center gap-3 p-5 text-sm text-muted">
        <Spinner /> Verifying your email…
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="space-y-5">
        <div className="panel flex items-start gap-3 p-5">
          <CheckCircle2 className="mt-0.5 size-5 text-moss-bright" />
          <div>
            <h2 className="font-display text-lg">Email verified</h2>
            <p className="mt-1 text-sm text-muted">
              Your account is fully activated. You can link Minecraft and claim rewards now.
            </p>
          </div>
        </div>
        <Link href="/dashboard" className="btn btn-primary btn-block">
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="panel flex items-start gap-3 p-5">
        <XCircle className="mt-0.5 size-5 text-ember" />
        <div>
          <h2 className="font-display text-lg">Verification failed</h2>
          <p className="mt-1 text-sm text-muted">{message || "This link is invalid or expired."}</p>
        </div>
      </div>
      <Link href="/login" className="btn btn-ghost btn-block">
        Back to sign in
      </Link>
    </div>
  );
}
