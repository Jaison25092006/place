import { prisma } from "@/lib/prisma";
import type { ApplicationStatus } from "@/generated/prisma/enums";

/**
 * Every function here takes the session user's id as its first argument and
 * folds it into the WHERE clause. Rule #1: there is no query in this file that
 * can reach a row belonging to somebody else.
 *
 * Single-row writes use updateMany/deleteMany with `userId` in the filter
 * rather than fetch-then-check, so ownership is enforced by the database in the
 * same statement — no window between the check and the write.
 */

export type ApplicationInput = {
  company: string;
  role: string;
  location: string | null;
  jobUrl: string | null;
  salary: string | null;
  source: string | null;
  status: ApplicationStatus;
  appliedDate: Date;
  notes: string | null;
};

const LIST_FIELDS = {
  id: true,
  company: true,
  role: true,
  status: true,
  appliedDate: true,
} as const;

export async function listApplications(userId: string) {
  return prisma.application.findMany({
    where: { userId },
    select: { ...LIST_FIELDS, location: true },
    orderBy: [{ appliedDate: "desc" }, { createdAt: "desc" }],
  });
}

export async function countApplications(userId: string) {
  return prisma.application.count({ where: { userId } });
}

/** Returns null when the row does not exist OR belongs to another user — the
 *  caller cannot tell the two apart, which is the point. */
export async function getApplication(userId: string, id: string) {
  return prisma.application.findFirst({
    where: { id, userId },
    select: {
      id: true,
      company: true,
      role: true,
      location: true,
      jobUrl: true,
      salary: true,
      source: true,
      status: true,
      appliedDate: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createApplication(userId: string, input: ApplicationInput) {
  return prisma.application.create({
    data: { ...input, userId },
    select: { id: true },
  });
}

/** True if a row owned by this user was updated; false if it did not exist or
 *  was not theirs. */
export async function updateApplication(
  userId: string,
  id: string,
  input: ApplicationInput,
): Promise<boolean> {
  const { count } = await prisma.application.updateMany({
    where: { id, userId },
    data: input,
  });
  return count === 1;
}

/** True if a row owned by this user was deleted. Its rounds go with it via the
 *  cascade on the foreign key. */
export async function deleteApplication(userId: string, id: string): Promise<boolean> {
  const { count } = await prisma.application.deleteMany({
    where: { id, userId },
  });
  return count === 1;
}
