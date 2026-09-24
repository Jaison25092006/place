import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { deleteRoundAction } from "@/app/actions/rounds";
import { secondaryButtonClass } from "@/app/ui";
import { getRound } from "@/lib/rounds";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Delete round · Placement Prep Tracker" };

export default async function DeleteRoundPage({
  params,
}: {
  params: Promise<{ id: string; roundId: string }>;
}) {
  const user = await requireUser();
  const { id, roundId } = await params;

  const round = await getRound(user.id, roundId);
  if (!round || round.application.id !== id) notFound();

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-20">
      <h1 className="text-xl font-semibold tracking-tight">Delete this round?</h1>

      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {round.type}
        </span>{" "}
        under {round.application.role} at {round.application.company} will be
        removed. This cannot be undone.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <form action={deleteRoundAction}>
          <input type="hidden" name="roundId" value={round.id} />
          <input type="hidden" name="applicationId" value={round.application.id} />
          <button
            type="submit"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Yes, delete it
          </button>
        </form>

        <Link href={`/applications/${round.application.id}`} className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </main>
  );
}
