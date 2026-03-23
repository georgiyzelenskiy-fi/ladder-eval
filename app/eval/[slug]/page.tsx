import { EvalJoinClient } from "./EvalJoinClient";

export default async function EvalJoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
        <main className="w-full max-w-lg text-center sm:text-left">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Configure{" "}
            <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
              NEXT_PUBLIC_CONVEX_URL
            </code>{" "}
            to use evaluator links.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col px-6 py-10">
      <EvalJoinClient key={slug} slug={slug} />
    </div>
  );
}
