import { redirect } from "next/navigation";

import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  name: string | null;
  email: string | null;
};

/**
 * The only way route code learns who is logged in.
 *
 * Rule #2: the id comes from the signed session cookie, never from a request
 * body, query string or form field.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) return null;

  return {
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
  };
}

/**
 * Same, but for routes that must not render without a user.
 * Rule #8: fail closed — redirect rather than serve partial data.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Returns the session user's id, or null. Convenience for query scoping (rule #1). */
export async function getSessionUserId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id ?? null;
}
