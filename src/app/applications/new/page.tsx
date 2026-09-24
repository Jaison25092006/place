import Link from "next/link";
import type { Metadata } from "next";

import { createApplicationAction } from "@/app/actions/applications";
import { ApplicationForm } from "@/app/applications/application-form";
import { ApplicationStatus } from "@/generated/prisma/enums";
import { toDateInputValue } from "@/lib/application-form";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "New application · Placement Prep Tracker" };

export default async function NewApplicationPage() {
  await requireUser();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        href="/applications"
        className="text-sm text-neutral-500 underline-offset-4 hover:underline"
      >
        ← Applications
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">New application</h1>

      <ApplicationForm
        action={createApplicationAction}
        submitLabel="Add application"
        cancelHref="/applications"
        initial={{
          company: "",
          role: "",
          location: "",
          jobUrl: "",
          salary: "",
          source: "",
          status: ApplicationStatus.APPLIED,
          appliedDate: toDateInputValue(new Date()),
          notes: "",
        }}
      />
    </main>
  );
}
