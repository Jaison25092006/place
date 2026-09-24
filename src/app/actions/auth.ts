"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";

export type AuthFormState = { error: string | null };

/** next's redirect() signals itself by throwing; that throw must not be swallowed. */
function isRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return { error: null };
  } catch (error) {
    if (isRedirect(error)) throw error;

    // One message for every failure mode, so it can't be used to probe which
    // emails exist. Rule #3: nothing about the password is echoed back.
    if (error instanceof AuthError) {
      return { error: "Incorrect email or password." };
    }

    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
