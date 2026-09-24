"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseApplicationForm } from "@/lib/application-form";
import {
  createApplication,
  deleteApplication,
  updateApplication,
} from "@/lib/applications";
import { requireUser } from "@/lib/session";

export type ApplicationFormState = { error: string | null };

/**
 * Rule #1 + #2: every action resolves the user from the session cookie first,
 * then passes that id into the data layer, which folds it into the WHERE
 * clause. The id in the form is only ever a row id, never a user id.
 */

export async function createApplicationAction(
  _prev: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const user = await requireUser();

  const parsed = parseApplicationForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const created = await createApplication(user.id, parsed.value);

  revalidatePath("/applications");
  redirect(`/applications/${created.id}`);
}

export async function updateApplicationAction(
  _prev: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "");
  if (id.length === 0) return { error: "Missing application id." };

  const parsed = parseApplicationForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const updated = await updateApplication(user.id, id, parsed.value);
  if (!updated) {
    // Not theirs, or gone. Same message either way — no probing.
    return { error: "That application could not be found." };
  }

  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
  redirect(`/applications/${id}`);
}

export async function deleteApplicationAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "");
  if (id.length === 0) redirect("/applications");

  await deleteApplication(user.id, id);

  revalidatePath("/applications");
  redirect("/applications");
}
