import type { MonthCount } from "@/lib/analytics";

/**
 * A plain inline-SVG bar chart. No chart library: the whole thing is one
 * server-rendered <svg>, so it costs zero client JavaScript.
 */

const monthLabel = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  timeZone: "UTC",
});
const monthYearLabel = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Months with no applications still need a slot, or the axis lies. */
function fillMonthGaps(data: MonthCount[]): MonthCount[] {
  if (data.length === 0) return [];

  const filled: MonthCount[] = [];
  const cursor = new Date(data[0].month);
  const last = data[data.length - 1].month;

  while (cursor <= last) {
    const match = data.find((row) => row.month.getTime() === cursor.getTime());
    filled.push({ month: new Date(cursor), count: match?.count ?? 0 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  // A single bar looks odd stretched across the full width; cap the window at
  // the most recent 12 months either way.
  return filled.slice(-12);
}

export function ApplicationsChart({ data }: { data: MonthCount[] }) {
  const months = fillMonthGaps(data);

  if (months.length === 0) {
    return (
      <p className="mt-6 text-sm text-neutral-500">
        Nothing to plot yet — add an application with an applied date.
      </p>
    );
  }

  const max = Math.max(...months.map((m) => m.count), 1);
  const barWidth = 100 / months.length;
  const chartHeight = 140;

  return (
    <figure className="mt-6">
      <svg
        viewBox={`0 0 100 ${chartHeight + 18}`}
        preserveAspectRatio="none"
        className="h-44 w-full"
        role="img"
        aria-label={`Applications per month. ${months
          .map((m) => `${monthYearLabel.format(m.month)}: ${m.count}`)
          .join(". ")}`}
      >
        {months.map((month, index) => {
          const height = (month.count / max) * chartHeight;
          const x = index * barWidth;

          return (
            <g key={month.month.toISOString()}>
              <rect
                x={x + barWidth * 0.18}
                y={chartHeight - height}
                width={barWidth * 0.64}
                height={Math.max(height, month.count > 0 ? 1.5 : 0)}
                rx={0.6}
                className="fill-neutral-900 dark:fill-neutral-100"
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight + 13}
                textAnchor="middle"
                className="fill-neutral-500"
                style={{ fontSize: "5px" }}
              >
                {monthLabel.format(month.month)}
              </text>
            </g>
          );
        })}
      </svg>

      <figcaption className="sr-only">
        <table>
          <caption>Applications per month</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Applications</th>
            </tr>
          </thead>
          <tbody>
            {months.map((month) => (
              <tr key={month.month.toISOString()}>
                <th scope="row">{monthYearLabel.format(month.month)}</th>
                <td>{month.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>

      <p className="mt-2 text-xs text-neutral-500">
        Peak month: {max} application{max === 1 ? "" : "s"}
      </p>
    </figure>
  );
}
