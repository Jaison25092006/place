import { RoundOutcome } from "@/generated/prisma/enums";
import { outcomeLabel } from "@/lib/round-form";

const TONE: Record<RoundOutcome, string> = {
  [RoundOutcome.PENDING]: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  [RoundOutcome.PASSED]: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  [RoundOutcome.FAILED]: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  [RoundOutcome.CANCELLED]: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

export function OutcomeBadge({ outcome }: { outcome: RoundOutcome }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONE[outcome]}`}
    >
      {outcomeLabel(outcome)}
    </span>
  );
}
