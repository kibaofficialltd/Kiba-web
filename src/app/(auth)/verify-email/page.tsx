import type { Metadata } from "next";
import { VerifyEmailClient } from "./verify-client";

export const metadata: Metadata = { title: "Verify email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div>
      <p className="eyebrow mb-3">Account activation</p>
      <h1 className="display-md mb-8">Confirming your email.</h1>
      <VerifyEmailClient token={token ?? null} />
    </div>
  );
}
