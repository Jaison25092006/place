"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { RoundFormState } from "@/app/actions/rounds";
import { fieldClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/app/ui";
import { OUTCOME_OPTIONS, ROUND_TYPE_SUGGESTIONS } from "@/lib/round-form";
import type { RoundOutcome } from "@/generated/prisma/enums";

export type RoundFormValues = {
  roundId?: string;
  applicationId: string;
  type: string;
  scheduledAt: string;
  outcome: RoundOutcome;
  interviewer: string;
  notes: string;
};

type Props = {
  action: (prev: RoundFormState, formData: FormData) => Promise<RoundFormState>;
  initial: RoundFormValues;
  submitLabel: string;
  cancelHref: string;
};

const initialState: RoundFormState = { error: null };

export function RoundForm({ action, initial, submitLabel, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      <input type="hidden" name="applicationId" value={initial.applicationId} />
      {initial.roundId ? (
        <input type="hidden" name="roundId" value={initial.roundId} />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className={labelClass}>
            Round type
          </label>
          <input
            id="type"
            name="type"
            required
            maxLength={80}
            list="round-type-suggestions"
            defaultValue={initial.type}
            className={fieldClass}
          />
          <datalist id="round-type-suggestions">
            {ROUND_TYPE_SUGGESTIONS.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="outcome" className={labelClass}>
            Outcome
          </label>
          <select
            id="outcome"
            name="outcome"
            defaultValue={initial.outcome}
            className={fieldClass}
          >
            {OUTCOME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="scheduledAt" className={labelClass}>
            Scheduled <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <input
            id="scheduledAt"
            name="scheduledAt"
            type="datetime-local"
            defaultValue={initial.scheduledAt}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="interviewer" className={labelClass}>
            Interviewer <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <input
            id="interviewer"
            name="interviewer"
            maxLength={120}
            defaultValue={initial.interviewer}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes <span className="font-normal text-neutral-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          maxLength={5000}
          defaultValue={initial.notes}
          className={fieldClass}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <Link href={cancelHref} className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${primaryButtonClass} mt-0 w-auto px-4`}
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
