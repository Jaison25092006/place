import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { OutcomeBadge } from "@/app/applications/outcome-badge";
import { StatusBadge } from "@/app/applications/status-badge";
import { secondaryButtonClass } from "@/app/ui";
import { getApplication } from "@/lib/applications";
import { listRounds } from "@/lib/rounds";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Application · Placement Prep Tracker" };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  // Rule #1: ownership is part of the query. Someone else's id returns null,
  // which becomes a 404 — indistinguishable from a row that does not exist.
  const application = await getApplication(user.id, id);
  if (!application) notFound();

  // Scoped through the parent: `application: { userId }` inside the query.
  const rounds = await listRounds(user.id, application.id);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        href="/applications"
        className="text-sm text-neutral-500 underline-offset-4 hover:underline"
      >
        ← Applications
      </Link>

      <div className="mt-4 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {application.company}
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            {application.role}
          </p>
          <div className="mt-3">
            <StatusBadge status={application.status} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link href={`/applications/${application.id}/edit`} className={secondaryButtonClass}>
            Edit
          </Link>
          <Link
            href={`/applications/${application.id}/delete`}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          >
            Delete
          </Link>
        </div>
      </div>

      <dl className="mt-10 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <Detail label="Applied" value={dateFormat.format(application.appliedDate)} />
        <Detail label="Location" value={application.location} />
        <Detail label="Salary" value={application.salary} />
        <Detail label="Source" value={application.source} />
        <Detail
          label="Job posting"
          value={
            application.jobUrl ? (
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all underline underline-offset-4"
              >
                {application.jobUrl}
              </a>
            ) : null
          }
        />
        <Detail label="Last updated" value={dateFormat.format(application.updatedAt)} />
      </dl>

      {application.notes ? (
        <div className="mt-10">
          <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Notes
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">
            {application.notes}
          </p>
        </div>
      ) : null}

      <section className="mt-14">
        <div className="flex items-center justify-between gap-6">
          <h2 className="text-lg font-semibold tracking-tight">
            Interview rounds
            {rounds.length > 0 ? (
              <span className="ml-2 text-sm font-normal text-neutral-500">
                {rounds.length}
              </span>
            ) : null}
          </h2>

          <Link
            href={`/applications/${application.id}/rounds/new`}
            className={secondaryButtonClass}
          >
            Add round
          </Link>
        </div>

        {rounds.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-neutral-300 px-6 py-10 text-center dark:border-neutral-700">
            <p className="text-sm text-neutral-500">
              No rounds recorded for this application yet.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {rounds.map((round) => (
              <li
                key={round.id}
                className="flex flex-wrap items-start justify-between gap-4 px-4 py-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{round.type}</span>
                    <OutcomeBadge outcome={round.outcome} />
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">
                    {round.scheduledAt
                      ? dateTimeFormat.format(round.scheduledAt)
                      : "Not scheduled"}
                    {round.interviewer ? ` · ${round.interviewer}` : ""}
                  </p>
                  {round.notes ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">
                      {round.notes}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <Link
                    href={`/applications/${application.id}/rounds/${round.id}/edit`}
                    className="underline underline-offset-4"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/applications/${application.id}/rounds/${round.id}/delete`}
                    className="text-red-700 underline underline-offset-4 dark:text-red-400"
                  >
                    Delete
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-1 text-sm">
        {value ?? <span className="text-neutral-400">—</span>}
      </dd>
    </div>
  );
}
