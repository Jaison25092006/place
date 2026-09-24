import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { updateRoundAction } from "@/app/actions/rounds";
import { RoundForm } from "@/app/applications/round-form";
import { toDateTimeInputValue } from "@/lib/round-form";
import { getRound } from "@/lib/rounds";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Edit round · Placement Prep Tracker" };

export default async function EditRoundPage({
  params,
}: {
  params: Promise<{ id: string; roundId: string }>;
}) {
  const user = await requireUser();
  const { id, roundId } = await params;

  // Scoped through the parent application's userId.
  const round = await getRound(user.id, roundId);
  // Guard against a round id that is real and theirs, but pasted under the
  // wrong application in the URL.
  if (!round || round.application.id !== id) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        href={`/applications/${round.application.id}`}
        className="text-sm text-neutral-500 underline-offset-4 hover:underline"
      >
        ← {round.application.company}
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Edit round</h1>

      <RoundForm
        action={updateRoundAction}
        submitLabel="Save changes"
        cancelHref={`/applications/${round.application.id}`}
        initial={{
          roundId: round.id,
          applicationId: round.application.id,
          type: round.type,
          scheduledAt: toDateTimeInputValue(round.scheduledAt),
          outcome: round.outcome,
          interviewer: round.interviewer ?? "",
          notes: round.notes ?? "",
        }}
      />
    </main>
  );
}
