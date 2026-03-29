import Link from "next/link";
import {
  BURGER_EVALUATOR_SLUGS,
  BURGER_ROSTER,
} from "@/lib/roster-presets/burger";

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
        <ul className="mt-8 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <Link
              href="/manage"
              className="font-medium text-zinc-900 underline decoration-zinc-400/70 underline-offset-2 hover:decoration-zinc-600 dark:text-zinc-100 dark:hover:decoration-zinc-500"
            >
              Team setup
            </Link>
            <span className="text-zinc-500 dark:text-zinc-500">
              {" "}
              — create session, roster, copy evaluator links
            </span>
          </li>
          <li>
            <Link
              href="/room/driver"
              className="font-medium text-zinc-900 underline decoration-zinc-400/70 underline-offset-2 hover:decoration-zinc-600 dark:text-zinc-100 dark:hover:decoration-zinc-500"
            >
              Manager control room
            </Link>
            <span className="text-zinc-500 dark:text-zinc-500">
              {" "}
              — phase, roster, active evaluator, prep progress, verdict
            </span>
          </li>
          <li>
            <Link
              href="/room/live-evaluation"
              className="font-medium text-zinc-900 underline decoration-zinc-400/70 underline-offset-2 hover:decoration-zinc-600 dark:text-zinc-100 dark:hover:decoration-zinc-500"
            >
              Live evaluation
            </Link>
            <span className="text-zinc-500 dark:text-zinc-500">
              {" "}
              — sequential peer reveal, calibration marks, matrix
            </span>
          </li>
          <li>
            <span className="text-zinc-600 dark:text-zinc-400">
              Manager (Burger preset):{" "}
            </span>
            <Link
              href="/eval/honza-sroubek"
              className="font-medium text-zinc-900 underline decoration-zinc-400/70 underline-offset-2 dark:text-zinc-100"
            >
              /eval/honza-sroubek
            </Link>
          </li>
          <li className="text-zinc-600 dark:text-zinc-400">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Team Burger — evaluators
            </span>
            <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-600 dark:text-zinc-400">
              {BURGER_EVALUATOR_SLUGS.map((s) => (
                <li key={s}>
                  <Link
                    href={`/eval/${s}`}
                    className="font-medium text-zinc-900 underline decoration-zinc-400/70 underline-offset-2 dark:text-zinc-100"
                  >
                    /eval/{s}
                  </Link>
                  <span className="text-zinc-500">
                    {" "}
                    —{" "}
                    {
                      BURGER_ROSTER.find((r) => r.slug === s)?.name
                    }
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-zinc-500">
              In the control room, click <strong>Seed “Burger” team</strong>{" "}
              once so names and roles exist before people open their links.
            </p>
          </li>
        </ul>
        <p className="mt-6 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
          Optional: set <code className="rounded bg-zinc-200/70 px-1 dark:bg-zinc-800">MANAGER_ACCESS_KEY</code>{" "}
          in <code className="text-xs">.env.local</code> and open{" "}
          <code className="text-xs">/room/driver?k=…</code> or{" "}
          <code className="text-xs">/room/live-evaluation?k=…</code> (server-side gate).
        </p>
      </main>
    </div>
  );
}
