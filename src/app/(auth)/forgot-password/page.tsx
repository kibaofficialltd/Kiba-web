import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <p className="eyebrow mb-3">Account recovery</p>
      <h1 className="display-md mb-2">Lost the key?</h1>
      <p className="mb-8 text-sm text-muted">
        Enter the email on your account and we will send a single-use reset link.
      </p>
      <ForgotForm />
    </div>
  );
}
