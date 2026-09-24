import Link from "next/link";
import { redirect } from "next/navigation";

import { primaryButtonClass, secondaryButtonClass } from "@/app/ui";
import { getSessionUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        Placement Prep Tracker
      </h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        Every application, every interview round, and what it all adds up to.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Link href="/signup" className={`${primaryButtonClass} mt-0 w-auto px-4`}>
          Get started
        </Link>
        <Link href="/login" className={secondaryButtonClass}>
          Log in
        </Link>
      </div>
    </main>
  );
}
