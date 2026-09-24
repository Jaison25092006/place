import { prisma } from "@/lib/prisma";
import type { RoundOutcome } from "@/generated/prisma/enums";

/**
 * Rounds have no userId of their own. Rule #1 is satisfied through the parent:
 * every filter here either goes through `application: { userId }` or resolves
 * the parent with a scoped query first.
 *
 * Nothing in this file accepts a bare round id without also constraining the
 * owning user in the same statement.
 */

export type RoundInput = {
  type: string;
  scheduledAt: Date | null;
  outcome: RoundOutcome;
  interviewer: string | null;
  notes: string | null;
};

const ROUND_FIELDS = {
  id: true,
  applicationId: true,
  type: true,
  scheduledAt: true,
  outcome: true,
  interviewer: true,
  notes: true,
} as const;

/** Rounds of one application, but only if that application is this user's. */
export async function listRounds(userId: string, applicationId: string) {
  return prisma.round.findMany({
    where: { applicationId, application: { userId } },
    select: ROUND_FIELDS,
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
  });
}

/** Null when the round does not exist, or its application is not this user's. */
export async function getRound(userId: string, roundId: string) {
  return prisma.round.findFirst({
    where: { id: roundId, application: { userId } },
    select: {
      ...ROUND_FIELDS,
      application: { select: { id: true, company: true, role: true } },
    },
  });
}

/**
 * Returns null when the parent application is not this user's.
 *
 * The ownership check and the insert run in one transaction, so the parent
 * cannot change hands (or be deleted) between them.
 */
export async function createRound(
  userId: string,
  applicationId: string,
  input: RoundInput,
): Promise<{ id: string } | null> {
  return prisma.$transaction(async (tx) => {
    const parent = await tx.application.findFirst({
      where: { id: applicationId, userId },
      select: { id: true },
    });

    if (!parent) return null;

    return tx.round.create({
      data: { ...input, applicationId: parent.id },
      select: { id: true },
    });
  });
}

/** True if a round under one of this user's applications was updated. */
export async function updateRound(
  userId: string,
  roundId: string,
  input: RoundInput,
): Promise<boolean> {
  const { count } = await prisma.round.updateMany({
    where: { id: roundId, application: { userId } },
    data: input,
  });
  return count === 1;
}

/** True if a round under one of this user's applications was deleted. */
export async function deleteRound(userId: string, roundId: string): Promise<boolean> {
  const { count } = await prisma.round.deleteMany({
    where: { id: roundId, application: { userId } },
  });
  return count === 1;
}
