import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe half of the Auth.js config.
 *
 * middleware.ts runs on the edge runtime, where bcryptjs and the Prisma client
 * cannot go. So the provider (which needs both) lives in src/auth.ts, and only
 * the cookie/JWT plumbing lives here where middleware can import it.
 */

/** Everything under these prefixes requires a session. Rule #8: fail closed. */
export const PROTECTED_PREFIXES = ["/dashboard", "/applications"] as const;

/** A logged-in user has no business on these. */
const AUTH_PAGES = ["/login", "/signup"] as const;

export const authConfig = {
  // Auth.js refuses to infer its own origin from the Host header in production
  // unless told to. Vercel sets this implicitly, but `next start` locally does
  // not — without it every /api/auth/* route 500s with UntrustedHost.
  // Phase 6 pins AUTH_URL in production so the header is not load-bearing.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;

      if (AUTH_PAGES.some((page) => pathname.startsWith(page))) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        // false => Auth.js redirects to pages.signIn with a callbackUrl.
        return isLoggedIn;
      }

      return true;
    },

    // The user id is minted into the token at sign-in and read back out of the
    // session. Rule #2: this is the only place a userId enters the app.
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },

    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
