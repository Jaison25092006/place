/**
 * Rule #1 regression test: can user A touch a row owned by user B?
 * Run with: npx tsx scripts/scope-test.ts
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

import { ApplicationStatus } from "@/generated/prisma/enums";
import {
  deleteApplication,
  getApplication,
  listApplications,
  updateApplication,
  type ApplicationInput,
} from "@/lib/applications";
import { prisma } from "@/lib/prisma";

let failures = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const pass = actual === expected;
  if (!pass) failures += 1;
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${name}  (got ${String(actual)}, want ${String(expected)})`);
}

const TAMPER: ApplicationInput = {
  company: "TAMPERED-BY-A",
  role: "TAMPERED",
  location: null,
  jobUrl: null,
  salary: null,
  source: null,
  status: ApplicationStatus.REJECTED,
  appliedDate: new Date("2020-01-01T00:00:00.000Z"),
  notes: null,
};

async function main() {
  const a = await prisma.user.findUniqueOrThrow({
    where: { email: "phase2-test@example.com" },
    select: { id: true },
  });
  const b = await prisma.user.findUniqueOrThrow({
    where: { email: "phase3-b@example.com" },
    select: { id: true },
  });

  const bRow = await prisma.application.findFirstOrThrow({
    where: { userId: b.id },
    select: { id: true, company: true },
  });

  console.log("\nlist scoping");
  const aList = await listApplications(a.id);
  const bList = await listApplications(b.id);
  check("A's list excludes B's row", aList.some((r) => r.id === bRow.id), false);
  check("B's list includes B's row", bList.some((r) => r.id === bRow.id), true);

  console.log("\nread scoping");
  check("A reading B's row returns null", await getApplication(a.id, bRow.id), null);
  check("B reading B's row succeeds", (await getApplication(b.id, bRow.id))?.id, bRow.id);

  console.log("\nupdate scoping");
  check("A updating B's row is refused", await updateApplication(a.id, bRow.id, TAMPER), false);
  const afterUpdate = await prisma.application.findUniqueOrThrow({
    where: { id: bRow.id },
    select: { company: true },
  });
  check("B's row is unchanged on disk", afterUpdate.company, bRow.company);

  console.log("\ndelete scoping");
  check("A deleting B's row is refused", await deleteApplication(a.id, bRow.id), false);
  const stillThere = await prisma.application.count({ where: { id: bRow.id } });
  check("B's row still exists", stillThere, 1);
  check("B deleting B's own row succeeds", await deleteApplication(b.id, bRow.id), true);
  check("B's row is gone", await prisma.application.count({ where: { id: bRow.id } }), 0);

  console.log(`\n${failures === 0 ? "all checks passed" : `${failures} FAILED`}`);
  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
