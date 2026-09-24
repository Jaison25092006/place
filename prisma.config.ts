import path from "node:path";

import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// The Prisma CLI does not read .env.local on its own (rule #4: secrets live
// there, never in a committed file). Load it before the config is evaluated.
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    // Used by `prisma migrate diff` / `studio`, which speak raw TCP on 5432.
    // Applying migrations from a network that blocks that port is handled by
    // `npm run db:apply` (scripts/migrate-ws.mjs) instead.
    url: process.env.DATABASE_URL!,
  },
});
