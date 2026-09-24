import { RoundOutcome } from "@/generated/prisma/enums";

import type { RoundInput } from "@/lib/rounds";

/** Rule #5: validated before the database is touched. */

export const OUTCOME_OPTIONS: { value: RoundOutcome; label: string }[] = [
  { value: RoundOutcome.PENDING, label: "Pending" },
  { value: RoundOutcome.PASSED, label: "Passed" },
  { value: RoundOutcome.FAILED, label: "Failed" },
  { value: RoundOutcome.CANCELLED, label: "Cancelled" },
];

/** Suggestions only — `type` is free text, so anything goes. */
export const ROUND_TYPE_SUGGESTIONS = [
  "Phone screen",
  "Recruiter call",
  "Online assessment",
  "Technical interview",
  "System design",
  "Pair programming",
  "Take-home review",
  "Behavioural",
  "Hiring manager",
  "Final round",
];

const OUTCOME_VALUES = new Set<string>(Object.values(RoundOutcome));

export function outcomeLabel(outcome: RoundOutcome): string {
  return OUTCOME_OPTIONS.find((option) => option.value === outcome)?.label ?? outcome;
}

export type ParsedRound = { ok: true; value: RoundInput } | { ok: false; error: string };

function text(form: FormData, key: string): string {
  const raw = form.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

export function parseRoundForm(form: FormData): ParsedRound {
  const type = text(form, "type");
  if (type.length === 0) return { ok: false, error: "Round type is required." };
  if (type.length > 80) return { ok: false, error: "Round type is too long." };

  const outcomeRaw = text(form, "outcome");
  if (!OUTCOME_VALUES.has(outcomeRaw)) {
    return { ok: false, error: "Pick a valid outcome." };
  }
  const outcome = outcomeRaw as RoundOutcome;

  // <input type="datetime-local"> has no timezone; treat it as UTC so the
  // stored instant round-trips to the same text in the form.
  const scheduledRaw = text(form, "scheduledAt");
  let scheduledAt: Date | null = null;
  if (scheduledRaw.length > 0) {
    scheduledAt = new Date(`${scheduledRaw}:00.000Z`);
    if (Number.isNaN(scheduledAt.getTime())) {
      return { ok: false, error: "Scheduled date is not valid." };
    }
  }

  const interviewerRaw = text(form, "interviewer");
  if (interviewerRaw.length > 120) return { ok: false, error: "Interviewer is too long." };
  const interviewer = interviewerRaw.length > 0 ? interviewerRaw : null;

  const notesRaw = text(form, "notes");
  if (notesRaw.length > 5000) return { ok: false, error: "Notes are too long." };
  const notes = notesRaw.length > 0 ? notesRaw : null;

  return { ok: true, value: { type, scheduledAt, outcome, interviewer, notes } };
}

/** YYYY-MM-DDTHH:mm for <input type="datetime-local">, read back in UTC. */
export function toDateTimeInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 16) : "";
}
