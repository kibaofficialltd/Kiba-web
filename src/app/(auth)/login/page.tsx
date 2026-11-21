import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Player login" };

export default function LoginPage() {
  return (
    <div>
      <p className="eyebrow mb-3">Player portal</p>
      <h1 className="display-md mb-2">Return to the world.</h1>
      <p className="mb-8 text-sm text-muted">
        Sign in to claim rewards, manage your linked profile and spend coins.
      </p>
      <Suspense fallback={<div className="h-64 skeleton" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
