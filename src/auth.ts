import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, parseCredentials } from "@/lib/validation";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(raw) {
        const parsed = parseCredentials(raw);
        if (!parsed.ok) return null;

        const user = await prisma.user.findUnique({
          where: { email: normalizeEmail(parsed.email) },
          select: { id: true, name: true, email: true, passwordHash: true },
        });

        // Compare even when the user is missing, so a bad email and a bad
        // password take the same time and can't be told apart.
        const hash = user?.passwordHash ?? DUMMY_HASH;
        const passwordMatches = await bcrypt.compare(parsed.password, hash);

        if (!user || !passwordMatches) return null;

        // Rule #3: the hash never leaves this function.
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
});

/** A real bcrypt hash of a value nobody can supply, for the timing-equalising compare above. */
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.tGNbGD1JMdJqHqkVQN1kMHqQ4H5Wc0O";
