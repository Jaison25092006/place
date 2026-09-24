import Link from "next/link";
import type { Metadata } from "next";

import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Sign up · Placement Prep Tracker" };

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Track every application and every round in one place.
      </p>

      <SignupForm />

      <p className="mt-6 text-sm text-neutral-500">
        Already have one?{" "}
        <Link href="/login" className="font-medium text-neutral-900 underline underline-offset-4 dark:text-neutral-100">
          Log in
        </Link>
      </p>
    </main>
  );
}
