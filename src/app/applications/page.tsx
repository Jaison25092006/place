import Link from "next/link";
import type { Metadata } from "next";

import { StatusBadge } from "@/app/applications/status-badge";
import { primaryButtonClass } from "@/app/ui";
import { listApplications } from "@/lib/applications";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Applications · Placement Prep Tracker" };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default async function ApplicationsPage() {
  const user = await requireUser();
  // Rule #1: scoped by the session user's id, inside the query.
  const applications = await listApplications(user.id);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {applications.length === 0
              ? "Nothing tracked yet."
              : `${applications.length} tracked.`}
          </p>
        </div>

        <Link href="/applications/new" className={`${primaryButtonClass} mt-0 w-auto px-4`}>
          Add application
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-neutral-300 px-6 py-16 text-center dark:border-neutral-700">
          <p className="text-sm font-medium">No applications yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
            Add the first one and every round, outcome and stat will build up from
            there.
          </p>
          <Link
            href="/applications/new"
            className="mt-6 inline-block text-sm font-medium underline underline-offset-4"
          >
            Add your first application
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Company</th>
                <th scope="col" className="px-4 py-3 font-medium">Role</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {applications.map((application) => (
                <tr
                  key={application.id}
                  className="transition hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/applications/${application.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {application.company}
                    </Link>
                    {application.location ? (
                      <span className="block text-xs font-normal text-neutral-500">
                        {application.location}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{application.role}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={application.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                    {dateFormat.format(application.appliedDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
