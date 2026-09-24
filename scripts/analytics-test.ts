/**
 * Phase 5: the dashboard figures must be computed in the database, scoped to
 * one user, and unaffected by anything another user owns.
 *
 * Seeds a known fixture for A, plus deliberately noisy data for B, then checks
 * A's analytics against hand-computed expectations.
 *
 * Run with: npm run test:analytics
 */
import { ApplicationStatus, RoundOutcome } from "@/generated/prisma/enums";
import { getAnalytics } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";

let failures = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const pass = actual === expected;
  if (!pass) failures += 1;
  console.log(
    `  ${pass ? "PASS" : "FAIL"}  ${name}  (got ${String(actual)}, want ${String(expected)})`,
  );
}

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

async function main() {
  const a = await prisma.user.findUniqueOrThrow({
    where: { email: "phase2-test@example.com" },
    select: { id: true },
  });
  const b = await prisma.user.findUniqueOrThrow({
    where: { email: "phase3-b@example.com" },
    select: { id: true },
  });

  // Clean slate for both users (cascade takes the rounds with them).
  await prisma.application.deleteMany({ where: { userId: { in: [a.id, b.id] } } });

  // --- A's fixture: 5 applications, 3 rounds -------------------------------
  const mk = (
    company: string,
    status: ApplicationStatus,
    appliedDate: Date,
  ) =>
    prisma.application.create({
      data: { userId: a.id, company, role: "Role", status, appliedDate },
      select: { id: true },
    });

  const withRounds = await mk("A-One", ApplicationStatus.APPLIED, d("2026-07-04"));
  await mk("A-Two", ApplicationStatus.APPLIED, d("2026-07-19"));
  await mk("A-Three", ApplicationStatus.INTERVIEWING, d("2026-08-02"));
  await mk("A-Four", ApplicationStatus.OFFER, d("2026-08-11"));
  await mk("A-Five", ApplicationStatus.REJECTED, d("2026-08-27"));

  // Three rounds, all on an application whose status is only APPLIED — so it
  // counts toward "interviews reached" via the rounds clause, not the status.
  for (const type of ["Phone screen", "Technical", "Final"]) {
    await prisma.round.create({
      data: { applicationId: withRounds.id, type, outcome: RoundOutcome.PASSED },
    });
  }

  // --- B's noise: 10 offers and 20 rounds, none of it A's business ---------
  for (let i = 0; i < 10; i += 1) {
    const app = await prisma.application.create({
      data: {
        userId: b.id,
        company: `B-Noise-${i}`,
        role: "Role",
        status: ApplicationStatus.OFFER,
        appliedDate: d("2026-01-15"),
      },
      select: { id: true },
    });
    await prisma.round.createMany({
      data: [
        { applicationId: app.id, type: "Noise 1", outcome: RoundOutcome.PASSED },
        { applicationId: app.id, type: "Noise 2", outcome: RoundOutcome.PASSED },
      ],
    });
  }

  const stats = await getAnalytics(a.id);

  console.log("\ntotals (A only)");
  check("total applications", stats.total, 5);
  check("offers", stats.offers, 1);
  check("rejected", stats.rejected, 1);
  check("active (saved/applied/OA/interviewing)", stats.active, 3);
  check("rounds recorded", stats.totalRounds, 3);

  console.log("\nsuccess rates");
  check("offer rate = 1/5", stats.offerRate, 0.2);
  // 1 INTERVIEWING + 1 OFFER + 1 APPLIED-with-rounds
  check("interviews reached", stats.interviewsReached, 3);
  check("interview rate = 3/5", stats.interviewRate, 0.6);

  console.log("\nby status");
  const byStatus = new Map(stats.byStatus.map((r) => [r.status, r.count]));
  check("APPLIED", byStatus.get(ApplicationStatus.APPLIED), 2);
  check("INTERVIEWING", byStatus.get(ApplicationStatus.INTERVIEWING), 1);
  check("OFFER", byStatus.get(ApplicationStatus.OFFER), 1);
  check("REJECTED", byStatus.get(ApplicationStatus.REJECTED), 1);
  check("SAVED (zero-filled, not omitted)", byStatus.get(ApplicationStatus.SAVED), 0);
  check("every status present", stats.byStatus.length, Object.values(ApplicationStatus).length);
  check("status counts sum to total", [...byStatus.values()].reduce((x, y) => x + y, 0), 5);

  console.log("\napplications over time");
  check("two months bucketed", stats.overTime.length, 2);
  check("July 2026 count", stats.overTime[0]?.count, 2);
  check("August 2026 count", stats.overTime[1]?.count, 3);
  check("first bucket is July", stats.overTime[0]?.month.toISOString().slice(0, 7), "2026-07");
  check("no January bucket from B's noise", stats.overTime.some((m) => m.month.getUTCMonth() === 0), false);

  console.log("\nB's own analytics are unaffected");
  const bStats = await getAnalytics(b.id);
  check("B total", bStats.total, 10);
  check("B offers", bStats.offers, 10);
  check("B rounds", bStats.totalRounds, 20);

  console.log("\nempty user");
  const empty = await prisma.user.create({
    data: { email: `empty-${Date.now()}@example.com`, passwordHash: "x" },
    select: { id: true },
  });
  const emptyStats = await getAnalytics(empty.id);
  check("total is 0", emptyStats.total, 0);
  check("offer rate is null, not NaN", emptyStats.offerRate, null);
  check("overTime is empty", emptyStats.overTime.length, 0);
  await prisma.user.delete({ where: { id: empty.id } });

  console.log(`\n${failures === 0 ? "all checks passed" : `${failures} FAILED`}`);
  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
