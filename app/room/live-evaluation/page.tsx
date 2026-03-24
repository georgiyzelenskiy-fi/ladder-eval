import { LiveEvaluationClient } from "./LiveEvaluationClient";

type Search = Promise<{ k?: string | string[] }>;

export default async function LiveEvaluationPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const key = typeof sp.k === "string" ? sp.k : undefined;
  const required = process.env.MANAGER_ACCESS_KEY;
  const managerGateActive = Boolean(required && required.length > 0);
  /** Only forward `?k=` when it matches env so we never persist a wrong guess to localStorage. */
  const managerKeyFromUrl =
    managerGateActive && required && key === required ? key : undefined;

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
        <main className="w-full max-w-lg text-center sm:text-left">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            DevSync
          </p>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Convex not configured
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Set{" "}
            <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
              NEXT_PUBLIC_CONVEX_URL
            </code>{" "}
            in <code className="text-xs">.env.local</code>, run{" "}
            <code className="text-xs">npm run convex:dev</code>, then reload.
          </p>
        </main>
      </div>
    );
  }

  return (
    <LiveEvaluationClient
      managerGateActive={managerGateActive}
      managerKey={managerKeyFromUrl}
    />
  );
}
