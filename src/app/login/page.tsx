import Link from "next/link";
import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in · Placement Prep Tracker" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Pick up where you left off.
      </p>

      <LoginForm />

      <p className="mt-6 text-sm text-neutral-500">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-neutral-900 underline underline-offset-4 dark:text-neutral-100">
          Sign up
        </Link>
      </p>
    </main>
  );
}
