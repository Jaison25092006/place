import Link from "next/link";
import type { Metadata } from "next";

import { logoutAction } from "@/app/actions/auth";
import { ApplicationsChart } from "@/app/dashboard/applications-chart";
import { StatusBadge } from "@/app/applications/status-badge";
import { secondaryButtonClass } from "@/app/ui";
import { getAnalytics } from "@/lib/analytics";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard · Placement Prep Tracker" };

export default async function DashboardPage() {
  // Rule #8: the page refuses to render without a session.
  const user = await requireUser();

  // Rule #1 + #6: one call, every figure aggregated in the database and
  // scoped to this user's id.
  const stats = await getAnalytics(user.id);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {user.name ?? user.email}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Signed in as {user.email}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link href="/applications" className={secondaryButtonClass}>
            Applications
          </Link>
          <form action={logoutAction}>
            <button type="submit" className={secondaryButtonClass}>
              Log out
            </button>
          </form>
        </div>
      </div>

      {stats.total === 0 ? (
        <div className="mt-12 rounded-lg border border-dashed border-neutral-300 px-6 py-16 text-center dark:border-neutral-700">
          <p className="text-sm font-medium">No numbers yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
            Track your first application and this page fills in: status
            breakdown, applications over time, and how far they get.
          </p>
          <Link
            href="/applications/new"
            className="mt-6 inline-block text-sm font-medium underline underline-offset-4"
          >
            Add your first application
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card
              label="Applications"
              value={String(stats.total)}
              hint={`${stats.active} still active`}
            />
            <Card
              label="Interviews reached"
              value={formatPercent(stats.interviewRate)}
              hint={`${stats.interviewsReached} of ${stats.total}`}
            />
            <Card
              label="Offers"
              value={formatPercent(stats.offerRate)}
              hint={`${stats.offers} of ${stats.total}`}
            />
            <Card
              label="Rounds recorded"
              value={String(stats.totalRounds)}
              hint={`${stats.rejected} rejection${stats.rejected === 1 ? "" : "s"}`}
            />
          </div>

          <section className="mt-12">
            <h2 className="text-lg font-semibold tracking-tight">
              Applications over time
            </h2>
            <p className="mt-1 text-sm text-neutral-500">By applied date, per month.</p>
            <ApplicationsChart data={stats.overTime} />
          </section>

          <section className="mt-14">
            <h2 className="text-lg font-semibold tracking-tight">By status</h2>

            <ul className="mt-5 flex flex-col gap-3">
              {stats.byStatus.map((row) => (
                <li key={row.status} className="flex items-center gap-4">
                  <span className="w-40 shrink-0">
                    <StatusBadge status={row.status} />
                  </span>

                  <span
                    className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full rounded-full bg-neutral-900 dark:bg-neutral-100"
                      style={{
                        width: `${stats.total === 0 ? 0 : (row.count / stats.total) * 100}%`,
                      }}
                    />
                  </span>

                  <span className="w-20 shrink-0 text-right text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
                    {row.count}
                    <span className="ml-1 text-neutral-400">
                      {formatPercent(stats.total === 0 ? null : row.count / stats.total)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 px-4 py-5 dark:border-neutral-800">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{hint}</p>
    </div>
  );
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}
