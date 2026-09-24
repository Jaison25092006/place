import { ApplicationStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

/**
 * Rule #6: every number here is computed by the database, and rule #1: every
 * query is constrained to the session user's id. No route hands rows to the
 * client to be counted there.
 */

export type StatusCount = { status: ApplicationStatus; count: number };
export type MonthCount = { month: Date; count: number };

export type Analytics = {
  total: number;
  byStatus: StatusCount[];
  overTime: MonthCount[];
  offers: number;
  interviewsReached: number;
  rejected: number;
  active: number;
  offerRate: number | null;
  interviewRate: number | null;
  totalRounds: number;
};

/** Statuses that mean the application is still live. */
const ACTIVE_STATUSES = [
  ApplicationStatus.SAVED,
  ApplicationStatus.APPLIED,
  ApplicationStatus.ONLINE_ASSESSMENT,
  ApplicationStatus.INTERVIEWING,
] as const;

function rate(part: number, whole: number): number | null {
  return whole === 0 ? null : part / whole;
}

export async function getAnalytics(userId: string): Promise<Analytics> {
  const [total, grouped, overTimeRows, offers, interviewsReached, rejected, active, totalRounds] =
    await Promise.all([
      prisma.application.count({ where: { userId } }),

      prisma.application.groupBy({
        by: ["status"],
        where: { userId },
        _count: { _all: true },
      }),

      // date_trunc has no Prisma equivalent. The tagged template parameterises
      // userId — it is never interpolated into the SQL string.
      prisma.$queryRaw<{ month: Date; count: number }[]>`
        SELECT date_trunc('month', "appliedDate") AS month,
               count(*)::int                      AS count
          FROM "Application"
         WHERE "userId" = ${userId}
         GROUP BY 1
         ORDER BY 1
      `,

      prisma.application.count({
        where: { userId, status: ApplicationStatus.OFFER },
      }),

      // "Reached an interview" = got to the interviewing stage or beyond, or
      // has at least one round recorded against it.
      prisma.application.count({
        where: {
          userId,
          OR: [
            { status: { in: [ApplicationStatus.INTERVIEWING, ApplicationStatus.OFFER] } },
            { rounds: { some: {} } },
          ],
        },
      }),

      prisma.application.count({
        where: { userId, status: ApplicationStatus.REJECTED },
      }),

      prisma.application.count({
        where: { userId, status: { in: [...ACTIVE_STATUSES] } },
      }),

      // Rounds are reached through the parent, as always.
      prisma.round.count({ where: { application: { userId } } }),
    ]);

  const countsByStatus = new Map(
    grouped.map((row) => [row.status, row._count._all] as const),
  );

  const byStatus: StatusCount[] = Object.values(ApplicationStatus).map((status) => ({
    status,
    count: countsByStatus.get(status) ?? 0,
  }));

  const overTime: MonthCount[] = overTimeRows.map((row) => ({
    month: new Date(row.month),
    count: Number(row.count),
  }));

  return {
    total,
    byStatus,
    overTime,
    offers,
    interviewsReached,
    rejected,
    active,
    offerRate: rate(offers, total),
    interviewRate: rate(interviewsReached, total),
    totalRounds,
  };
}
