import { ApplicationStatus } from "@/generated/prisma/enums";

import type { ApplicationInput } from "@/lib/applications";

/** Rule #5: the form payload is validated before it reaches the database. */

export const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: ApplicationStatus.SAVED, label: "Saved" },
  { value: ApplicationStatus.APPLIED, label: "Applied" },
  { value: ApplicationStatus.ONLINE_ASSESSMENT, label: "Online assessment" },
  { value: ApplicationStatus.INTERVIEWING, label: "Interviewing" },
  { value: ApplicationStatus.OFFER, label: "Offer" },
  { value: ApplicationStatus.REJECTED, label: "Rejected" },
  { value: ApplicationStatus.WITHDRAWN, label: "Withdrawn" },
];

const STATUS_VALUES = new Set<string>(Object.values(ApplicationStatus));

export function statusLabel(status: ApplicationStatus): string {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export type ParsedApplication =
  | { ok: true; value: ApplicationInput }
  | { ok: false; error: string };

function text(form: FormData, key: string): string {
  const raw = form.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function optionalText(form: FormData, key: string, max: number): string | null | false {
  const value = text(form, key);
  if (value.length === 0) return null;
  if (value.length > max) return false;
  return value;
}

export function parseApplicationForm(form: FormData): ParsedApplication {
  const company = text(form, "company");
  if (company.length === 0) return { ok: false, error: "Company is required." };
  if (company.length > 120) return { ok: false, error: "Company name is too long." };

  const role = text(form, "role");
  if (role.length === 0) return { ok: false, error: "Role is required." };
  if (role.length > 120) return { ok: false, error: "Role is too long." };

  const statusRaw = text(form, "status");
  if (!STATUS_VALUES.has(statusRaw)) {
    return { ok: false, error: "Pick a valid status." };
  }
  const status = statusRaw as ApplicationStatus;

  const appliedDateRaw = text(form, "appliedDate");
  if (appliedDateRaw.length === 0) {
    return { ok: false, error: "Applied date is required." };
  }
  // <input type="date"> gives YYYY-MM-DD; pin it to UTC midnight so the stored
  // day does not drift with the server's timezone.
  const appliedDate = new Date(`${appliedDateRaw}T00:00:00.000Z`);
  if (Number.isNaN(appliedDate.getTime())) {
    return { ok: false, error: "Applied date is not a valid date." };
  }

  const location = optionalText(form, "location", 120);
  if (location === false) return { ok: false, error: "Location is too long." };

  const jobUrl = optionalText(form, "jobUrl", 2000);
  if (jobUrl === false) return { ok: false, error: "Job URL is too long." };
  if (jobUrl !== null && !/^https?:\/\/\S+$/i.test(jobUrl)) {
    return { ok: false, error: "Job URL must start with http:// or https://" };
  }

  const salary = optionalText(form, "salary", 60);
  if (salary === false) return { ok: false, error: "Salary is too long." };

  const source = optionalText(form, "source", 60);
  if (source === false) return { ok: false, error: "Source is too long." };

  const notes = optionalText(form, "notes", 5000);
  if (notes === false) return { ok: false, error: "Notes are too long." };

  return {
    ok: true,
    value: { company, role, location, jobUrl, salary, source, status, appliedDate, notes },
  };
}

/** YYYY-MM-DD for <input type="date">, read in UTC to match how it was stored. */
export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
