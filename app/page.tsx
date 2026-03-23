export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-lg text-center sm:text-left">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          DevSync
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Skill matrix scaffold
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Next.js App Router + Convex + Tailwind. Run{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-sm dark:bg-zinc-800">
            npm run convex:dev
          </code>{" "}
          in one terminal, add{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-sm dark:bg-zinc-800">
            NEXT_PUBLIC_CONVEX_URL
          </code>{" "}
          to <code className="text-sm">.env.local</code>, then{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-sm dark:bg-zinc-800">
            npm run dev
          </code>
          .
        </p>
      </main>
    </div>
  );
}
