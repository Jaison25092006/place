/** Rule #5: every boundary validates before the database is touched. */

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 200;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

type ParsedCredentials =
  | { ok: true; email: string; password: string }
  | { ok: false; error: string };

export function parseCredentials(raw: unknown): ParsedCredentials {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "Missing credentials." };
  }

  const { email, password } = raw as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string") {
    return { ok: false, error: "Email and password are required." };
  }

  const cleanEmail = normalizeEmail(email);

  if (!EMAIL_RE.test(cleanEmail)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, error: "Password is too long." };
  }

  return { ok: true, email: cleanEmail, password };
}

type ParsedSignup =
  | { ok: true; email: string; password: string; name: string | null }
  | { ok: false; error: string };

export function parseSignup(raw: unknown): ParsedSignup {
  const credentials = parseCredentials(raw);
  if (!credentials.ok) return credentials;

  const { name } = raw as Record<string, unknown>;

  if (name !== undefined && name !== null && typeof name !== "string") {
    return { ok: false, error: "Name must be text." };
  }

  const cleanName = typeof name === "string" ? name.trim() : "";

  if (cleanName.length > 100) {
    return { ok: false, error: "Name is too long." };
  }

  return {
    ok: true,
    email: credentials.email,
    password: credentials.password,
    name: cleanName.length > 0 ? cleanName : null,
  };
}
