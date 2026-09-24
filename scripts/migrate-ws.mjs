/**
 * Applies prisma/migrations over Neon's WebSocket transport (port 443).
 *
 * Why this exists: `prisma migrate deploy` drives the schema engine, which only
 * speaks raw TCP on 5432. On networks that block that port the CLI cannot
 * connect, even though the app itself works fine over the Neon driver. This
 * script does what `migrate deploy` does — run each pending migration in order
 * and record it in _prisma_migrations — using the transport that does get out.
 *
 * It is deliberately compatible with the real CLI: the checksums and table
 * layout match, so `prisma migrate status` against an unblocked network agrees
 * with what this wrote, and either tool can take over from the other.
 *
 * This is also what runs on Vercel — vercel.json sets buildCommand to
 * `npm run db:apply && next build`, so a deploy migrates then builds, and a
 * failed migration fails the deploy instead of shipping against old columns.
 * DATABASE_URL
 * there is Neon's *pooled* endpoint, and the schema engine behind
 * `prisma migrate deploy` needs a direct, non-PgBouncer connection — so using
 * this script means production needs one connection string, not two.
 *
 *   node scripts/migrate-ws.mjs          apply pending migrations
 *   node scripts/migrate-ws.mjs --status report without changing anything
 */
import { createHash, randomUUID } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { Client, neonConfig } from "@neondatabase/serverless";
import { config as loadEnv } from "dotenv";
import ws from "ws";

loadEnv({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
neonConfig.webSocketConstructor = ws;

const MIGRATIONS_DIR = path.join("prisma", "migrations");
const statusOnly = process.argv.includes("--status");

const CREATE_MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                    VARCHAR(36) PRIMARY KEY NOT NULL,
  "checksum"              VARCHAR(64) NOT NULL,
  "finished_at"           TIMESTAMPTZ,
  "migration_name"        VARCHAR(255) NOT NULL,
  "logs"                  TEXT,
  "rolled_back_at"        TIMESTAMPTZ,
  "started_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count"   INTEGER NOT NULL DEFAULT 0
);`;

function discoverMigrations() {
  let entries;
  try {
    entries = readdirSync(MIGRATIONS_DIR);
  } catch {
    return [];
  }

  return entries
    .filter((name) => statSync(path.join(MIGRATIONS_DIR, name)).isDirectory())
    .sort()
    .map((name) => {
      const sql = readFileSync(path.join(MIGRATIONS_DIR, name, "migration.sql"), "utf8");
      return {
        name,
        sql,
        checksum: createHash("sha256").update(sql).digest("hex"),
      };
    });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Same failure, two very different fixes depending on where we are.
    if (process.env.VERCEL) {
      // "Set in the dashboard" and "actually present in the build" are not the
      // same thing — a blank value, or one scoped to another environment, both
      // land here. List the keys that *are* present so the next failed build
      // says which. Names only: never print a value, redacted or otherwise.
      const present = Object.keys(process.env)
        .filter((key) => /DATABASE|POSTGRES|PRISMA/i.test(key))
        .sort();

      console.error(
        `DATABASE_URL is not usable in this Vercel build (VERCEL_ENV=${process.env.VERCEL_ENV ?? "?"}).`,
      );
      console.error(
        "DATABASE_URL" in process.env
          ? "  It exists but is empty — re-add it with a real value."
          : "  It is not present in the build environment at all.",
      );
      console.error(
        present.length
          ? `  Database-ish keys that are present: ${present.join(", ")}`
          : "  No database-related keys are present at all.",
      );
      console.error(
        "  Fix: Settings → Environments → add DATABASE_URL (Neon *pooled*\n" +
          "  string, host ending in -pooler) for this environment, then deploy.",
      );
    } else {
      console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
    }
    process.exit(1);
  }

  const migrations = discoverMigrations();
  if (migrations.length === 0) {
    console.log("No migrations found in prisma/migrations.");
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(CREATE_MIGRATIONS_TABLE);

    const { rows } = await client.query(
      `SELECT migration_name, checksum, finished_at, rolled_back_at
         FROM "_prisma_migrations"`,
    );
    const applied = new Map(rows.map((row) => [row.migration_name, row]));

    for (const migration of migrations) {
      const record = applied.get(migration.name);

      if (record?.finished_at && !record.rolled_back_at) {
        const drifted = record.checksum !== migration.checksum;
        console.log(
          `  = ${migration.name} already applied${drifted ? "  ⚠ CHECKSUM DRIFT — the file changed after it ran" : ""}`,
        );
        continue;
      }

      if (statusOnly) {
        console.log(`  + ${migration.name} PENDING`);
        continue;
      }

      process.stdout.write(`  + ${migration.name} applying… `);
      const startedAt = new Date();

      try {
        await client.query("BEGIN");
        await client.query(migration.sql);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        console.log("FAILED");
        throw error;
      }

      await client.query(
        `INSERT INTO "_prisma_migrations"
           (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
         VALUES ($1, $2, $3, $4, now(), 1)`,
        [randomUUID(), migration.checksum, migration.name, startedAt],
      );

      console.log("done");
    }

    if (statusOnly) {
      console.log("\nStatus only — nothing was changed.");
    } else {
      console.log("\nAll migrations applied.");
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("\nMigration failed:", error.message);
  process.exit(1);
});
