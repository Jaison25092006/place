"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseRoundForm } from "@/lib/round-form";
import { createRound, deleteRound, getRound, updateRound } from "@/lib/rounds";
import { requireUser } from "@/lib/session";

export type RoundFormState = { error: string | null };

/**
 * Every action resolves the session user first, then hands that id to the data
 * layer, which constrains the statement through `application: { userId }`.
 * The applicationId and roundId in the form are only ever row ids.
 */

export async function createRoundAction(
  _prev: RoundFormState,
  formData: FormData,
): Promise<RoundFormState> {
  const user = await requireUser();

  const applicationId = String(formData.get("applicationId") ?? "");
  if (applicationId.length === 0) return { error: "Missing application id." };

  const parsed = parseRoundForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const created = await createRound(user.id, applicationId, parsed.value);
  if (!created) {
    // The parent is not theirs, or is gone. Same message either way.
    return { error: "That application could not be found." };
  }

  revalidatePath(`/applications/${applicationId}`);
  redirect(`/applications/${applicationId}`);
}

export async function updateRoundAction(
  _prev: RoundFormState,
  formData: FormData,
): Promise<RoundFormState> {
  const user = await requireUser();

  const roundId = String(formData.get("roundId") ?? "");
  if (roundId.length === 0) return { error: "Missing round id." };

  const parsed = parseRoundForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  // Read it back through the same scoped path, so the redirect target is a
  // parent this user actually owns rather than whatever the form claimed.
  const existing = await getRound(user.id, roundId);
  if (!existing) return { error: "That round could not be found." };

  const updated = await updateRound(user.id, roundId, parsed.value);
  if (!updated) return { error: "That round could not be found." };

  revalidatePath(`/applications/${existing.application.id}`);
  redirect(`/applications/${existing.application.id}`);
}

export async function deleteRoundAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const roundId = String(formData.get("roundId") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "");

  if (roundId.length > 0) {
    await deleteRound(user.id, roundId);
  }

  revalidatePath(`/applications/${applicationId}`);
  redirect(applicationId.length > 0 ? `/applications/${applicationId}` : "/applications");
}
