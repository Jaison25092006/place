import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { createRoundAction } from "@/app/actions/rounds";
import { RoundForm } from "@/app/applications/round-form";
import { RoundOutcome } from "@/generated/prisma/enums";
import { getApplication } from "@/lib/applications";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Add round · Placement Prep Tracker" };

export default async function NewRoundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  // The form is only rendered for a parent this user owns; the action
  // re-checks independently.
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

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Add a round</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {application.role} at {application.company}
      </p>

      <RoundForm
        action={createRoundAction}
        submitLabel="Add round"
        cancelHref={`/applications/${application.id}`}
        initial={{
          applicationId: application.id,
          type: "",
          scheduledAt: "",
          outcome: RoundOutcome.PENDING,
          interviewer: "",
          notes: "",
        }}
      />
    </main>
  );
}
