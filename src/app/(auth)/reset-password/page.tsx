import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div>
        <p className="eyebrow mb-3">Account recovery</p>
        <h1 className="display-md mb-4">Link incomplete.</h1>
        <p className="mb-6 text-sm text-muted">
          This reset link is missing its token. Request a fresh link from the recovery page.
        </p>
        <Link href="/forgot-password" className="btn btn-primary btn-block">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow mb-3">Account recovery</p>
      <h1 className="display-md mb-2">Choose a new password.</h1>
      <p className="mb-8 text-sm text-muted">
        All other sessions on your account will be signed out once you save.
      </p>
      <ResetForm token={token} />
    </div>
  );
}
