import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { updateApplicationAction } from "@/app/actions/applications";
import { ApplicationForm } from "@/app/applications/application-form";
import { toDateInputValue } from "@/lib/application-form";
import { getApplication } from "@/lib/applications";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Edit application · Placement Prep Tracker" };

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  // Rule #1: the edit form itself is only rendered for a row this user owns.
  const application = await getApplication(user.id, id);
  if (!application) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        href={`/applications/${application.id}`}
        className="text-sm text-neutral-500 underline-offset-4 hover:underline"
      >
        ← {application.company}
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Edit application</h1>

      <ApplicationForm
        action={updateApplicationAction}
        submitLabel="Save changes"
        cancelHref={`/applications/${application.id}`}
        initial={{
          id: application.id,
          company: application.company,
          role: application.role,
          location: application.location ?? "",
          jobUrl: application.jobUrl ?? "",
          salary: application.salary ?? "",
          source: application.source ?? "",
          status: application.status,
          appliedDate: toDateInputValue(application.appliedDate),
          notes: application.notes ?? "",
        }}
      />
    </main>
  );
}
