import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// Only the edge-safe config here — see the note in src/auth.config.ts.
// The `authorized` callback decides who gets through.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: [
    // Everything except Next internals, the auth API itself, and static files.
    // `\\.` not `\.` — this is a JS string, so a single backslash is dropped
    // and the dot would match any character, letting /applications/abcsvg skip
    // middleware entirely. (Those pages still fail closed on their own
    // requireUser() call, but this layer should not be the leaky one.)
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
