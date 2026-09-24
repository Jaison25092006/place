"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { fieldClass, labelClass, primaryButtonClass } from "@/app/ui";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not create the account.");
        setPending(false);
        return;
      }

      // Account created — send them to log in with it.
      router.push("/login");
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <div>
        <label htmlFor="name" className={labelClass}>
          Name <span className="font-normal text-neutral-400">(optional)</span>
        </label>
        <input id="name" name="name" type="text" autoComplete="name" className={fieldClass} />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          className={fieldClass}
        />
        <p className="mt-1 text-xs text-neutral-500">
          At least {MIN_PASSWORD_LENGTH} characters.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
