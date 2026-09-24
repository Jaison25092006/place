"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ApplicationFormState } from "@/app/actions/applications";
import { fieldClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/app/ui";
import { STATUS_OPTIONS } from "@/lib/application-form";
import type { ApplicationStatus } from "@/generated/prisma/enums";

export type ApplicationFormValues = {
  id?: string;
  company: string;
  role: string;
  location: string;
  jobUrl: string;
  salary: string;
  source: string;
  status: ApplicationStatus;
  appliedDate: string;
  notes: string;
};

type Props = {
  action: (
    prev: ApplicationFormState,
    formData: FormData,
  ) => Promise<ApplicationFormState>;
  initial: ApplicationFormValues;
  submitLabel: string;
  cancelHref: string;
};

const initialState: ApplicationFormState = { error: null };

export function ApplicationForm({ action, initial, submitLabel, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="company" className={labelClass}>
            Company
          </label>
          <input
            id="company"
            name="company"
            required
            maxLength={120}
            defaultValue={initial.company}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="role" className={labelClass}>
            Role
          </label>
          <input
            id="role"
            name="role"
            required
            maxLength={120}
            defaultValue={initial.role}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initial.status}
            className={fieldClass}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="appliedDate" className={labelClass}>
            Applied date
          </label>
          <input
            id="appliedDate"
            name="appliedDate"
            type="date"
            required
            defaultValue={initial.appliedDate}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="location" className={labelClass}>
            Location <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <input
            id="location"
            name="location"
            maxLength={120}
            defaultValue={initial.location}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="salary" className={labelClass}>
            Salary <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <input
            id="salary"
            name="salary"
            maxLength={60}
            defaultValue={initial.salary}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="source" className={labelClass}>
            Source <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <input
            id="source"
            name="source"
            maxLength={60}
            placeholder="Referral, LinkedIn, careers page…"
            defaultValue={initial.source}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="jobUrl" className={labelClass}>
            Job URL <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <input
            id="jobUrl"
            name="jobUrl"
            type="url"
            maxLength={2000}
            placeholder="https://…"
            defaultValue={initial.jobUrl}
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
