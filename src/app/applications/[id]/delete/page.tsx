import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { deleteApplicationAction } from "@/app/actions/applications";
import { secondaryButtonClass } from "@/app/ui";
import { getApplication } from "@/lib/applications";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Delete application · Placement Prep Tracker" };

/**
 * The confirm step is its own page rather than a browser confirm(), so the
 * destructive action needs a deliberate POST and works without JavaScript.
 */
export default async function DeleteApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const application = await getApplication(user.id, id);
  if (!application) notFound();

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-20">
      <h1 className="text-xl font-semibold tracking-tight">Delete this application?</h1>

      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {application.role}
        </span>{" "}
        at{" "}
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {application.company}
        </span>{" "}
        will be removed, along with every interview round recorded under it.
        This cannot be undone.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <form action={deleteApplicationAction}>
          <input type="hidden" name="id" value={application.id} />
          <button
            type="submit"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Yes, delete it
          </button>
        </form>

        <Link href={`/applications/${application.id}`} className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </main>
  );
}
