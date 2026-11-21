import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div>
      <p className="eyebrow mb-3">Join the network</p>
      <h1 className="display-md mb-2">Forge your identity.</h1>
      <p className="mb-8 text-sm text-muted">
        One account for the website, the store and your in-game rewards.
      </p>
      <RegisterForm />
    </div>
  );
}
