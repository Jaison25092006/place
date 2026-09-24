import { ApplicationStatus } from "@/generated/prisma/enums";
import { statusLabel } from "@/lib/application-form";

const TONE: Record<ApplicationStatus, string> = {
  [ApplicationStatus.SAVED]: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  [ApplicationStatus.APPLIED]: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  [ApplicationStatus.ONLINE_ASSESSMENT]: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  [ApplicationStatus.INTERVIEWING]: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  [ApplicationStatus.OFFER]: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  [ApplicationStatus.REJECTED]: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  [ApplicationStatus.WITHDRAWN]: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONE[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}
