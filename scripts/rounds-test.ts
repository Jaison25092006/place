/**
 * Rule #1 for rounds: they have no userId, so every check must travel through
 * the parent application. Plus the cascade Phase 4 asks us to confirm.
 *
 * Run with: npm run test:rounds
 */
import { ApplicationStatus, RoundOutcome } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  createRound,
  deleteRound,
  getRound,
  listRounds,
  updateRound,
  type RoundInput,
} from "@/lib/rounds";

let failures = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const pass = actual === expected;
  if (!pass) failures += 1;
  console.log(
    `  ${pass ? "PASS" : "FAIL"}  ${name}  (got ${String(actual)}, want ${String(expected)})`,
  );
}

const TAMPER: RoundInput = {
  type: "TAMPERED-BY-A",
  scheduledAt: null,
  outcome: RoundOutcome.FAILED,
  interviewer: null,
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

  // Fresh fixtures owned by B.
  const bApp = await prisma.application.create({
    data: {
      userId: b.id,
      company: "BRAVO-ROUNDS-CO",
      role: "Bravo Role",
      status: ApplicationStatus.INTERVIEWING,
      appliedDate: new Date("2026-09-01T00:00:00.000Z"),
    },
    select: { id: true },
  });

  const bRound = await prisma.round.create({
    data: {
      applicationId: bApp.id,
      type: "BRAVO-ONLY-ROUND",
      outcome: RoundOutcome.PENDING,
      scheduledAt: new Date("2026-09-20T10:00:00.000Z"),
    },
    select: { id: true, type: true },
  });

  console.log("\nlist scoping (through parent)");
  check("A listing rounds of B's application is empty", (await listRounds(a.id, bApp.id)).length, 0);
  check("B listing rounds of B's application sees it", (await listRounds(b.id, bApp.id)).length, 1);

  console.log("\nread scoping");
  check("A reading B's round returns null", await getRound(a.id, bRound.id), null);
  check("B reading B's round succeeds", (await getRound(b.id, bRound.id))?.id, bRound.id);

  console.log("\ncreate scoping (parent ownership)");
  check("A adding a round to B's application is refused", await createRound(a.id, bApp.id, TAMPER), null);
  check("B's application still has 1 round", await prisma.round.count({ where: { applicationId: bApp.id } }), 1);
  const bMade = await createRound(b.id, bApp.id, { ...TAMPER, type: "B's own second round" });
  check("B adding a round to their own application succeeds", bMade !== null, true);

  console.log("\nupdate scoping");
  check("A updating B's round is refused", await updateRound(a.id, bRound.id, TAMPER), false);
  const afterUpdate = await prisma.round.findUniqueOrThrow({
    where: { id: bRound.id },
    select: { type: true },
  });
  check("B's round is unchanged on disk", afterUpdate.type, bRound.type);
  check("B updating their own round succeeds", await updateRound(b.id, bRound.id, { ...TAMPER, type: "Renamed by B" }), true);

  console.log("\ndelete scoping");
  check("A deleting B's round is refused", await deleteRound(a.id, bRound.id), false);
  check("B's round still exists", await prisma.round.count({ where: { id: bRound.id } }), 1);
  check("B deleting their own round succeeds", await deleteRound(b.id, bRound.id), true);

  console.log("\ncascade: deleting an application removes its rounds");
  const before = await prisma.round.count({ where: { applicationId: bApp.id } });
  check("B's application has rounds before the delete", before > 0, true);
  await prisma.application.delete({ where: { id: bApp.id } });
  check("rounds are gone after the parent is deleted", await prisma.round.count({ where: { applicationId: bApp.id } }), 0);
  check("the application is gone too", await prisma.application.count({ where: { id: bApp.id } }), 0);

  console.log(`\n${failures === 0 ? "all checks passed" : `${failures} FAILED`}`);
  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
