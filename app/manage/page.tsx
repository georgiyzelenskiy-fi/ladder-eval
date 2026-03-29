import { ManageClient } from "./ManageClient";

type Search = Promise<{ k?: string | string[] }>;

export default async function ManagePage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const key = typeof sp.k === "string" ? sp.k : undefined;
  const required = process.env.MANAGER_ACCESS_KEY;
  const managerGateActive = Boolean(required && required.length > 0);
  const managerKeyFromUrl =
    managerGateActive && required && key === required ? key : undefined;

  if (required && key !== required) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center px-6 py-16">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Not found.</p>
      </div>
    );
  }

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Set{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 text-xs dark:bg-zinc-800">
            NEXT_PUBLIC_CONVEX_URL
          </code>{" "}
          in <code className="text-xs">.env.local</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex-1 bg-zinc-50 px-6 py-10 dark:bg-black">
      <ManageClient managerKeyFromUrl={managerKeyFromUrl} />
    </div>
  );
}
