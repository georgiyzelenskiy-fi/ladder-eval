"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  persistManagerAccessKey,
  useStoredManagerAccessKey,
} from "@/lib/devsync-browser";
import { DEFAULT_SESSION_SLUG } from "@/lib/devsync-constants";
import {
  readManageSessionSlug,
  writeManageSessionSlug,
} from "@/lib/manage-session-storage";
import {
  BURGER_ROSTER,
  BURGER_TEAM_TITLE,
} from "@/lib/roster-presets/burger";
import { normalizeSessionSlug } from "@/lib/session-slug";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = { managerKeyFromUrl?: string };

export function ManageClient({ managerKeyFromUrl }: Props) {
  const storedManagerKey = useStoredManagerAccessKey();
  const effectiveManagerKey = managerKeyFromUrl ?? storedManagerKey ?? undefined;

  useEffect(() => {
    if (managerKeyFromUrl) persistManagerAccessKey(managerKeyFromUrl);
  }, [managerKeyFromUrl]);

  const [slugInput, setSlugInput] = useState("");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const saved = readManageSessionSlug();
    if (saved) {
      setActiveSlug(saved);
      setSlugInput(saved);
    }
  }, []);

  const session = useQuery(
    api.session.getSession,
    activeSlug ? { slug: activeSlug } : "skip",
  );

  const createSession = useMutation(api.session.createSession);
  const updateSessionTitle = useMutation(api.session.updateSessionTitle);
  const seedRoster = useMutation(api.users.seedRoster);
  const upsertRosterUser = useMutation(api.users.upsertRosterUser);
  const removeRosterUser = useMutation(api.users.removeRosterUser);

  const sessionId = session?._id;
  const roster = useQuery(
    api.users.listUsers,
    sessionId ? { sessionId } : "skip",
  );

  const [titleDraft, setTitleDraft] = useState("");
  useEffect(() => {
    if (session === undefined || session === null) return;
    setTitleDraft(session.title ?? "");
  }, [session]);

  const [addSlug, setAddSlug] = useState("");
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState<"evaluator" | "manager">("evaluator");

  const run = useCallback(async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    setFormError(null);
    try {
      await fn();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, []);

  const openSession = () => {
    setFormError(null);
    try {
      const normalized = normalizeSessionSlug(slugInput);
      writeManageSessionSlug(normalized);
      setActiveSlug(normalized);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Invalid session slug");
    }
  };

  const onCreateSession = () => {
    void run("create", async () => {
      const normalized = normalizeSessionSlug(slugInput);
      await createSession({
        slug: normalized,
        managerKey: effectiveManagerKey,
      });
      writeManageSessionSlug(normalized);
      setActiveSlug(normalized);
    });
  };

  const evalLinks = useMemo(() => {
    if (typeof window === "undefined" || !roster || !activeSlug) return [];
    const origin = window.location.origin;
    return roster
      .filter((u: Doc<"users">) => u.role === "evaluator")
      .map((u: Doc<"users">) => {
        const q =
          activeSlug !== DEFAULT_SESSION_SLUG
            ? `?session=${encodeURIComponent(activeSlug)}`
            : "";
        return {
          user: u,
          href: `${origin}/eval/${encodeURIComponent(u.slug)}${q}`,
        };
      });
  }, [roster, activeSlug]);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setFormError("Could not copy to clipboard");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Manager
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Team setup
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          Create or open a session, seed the roster, then share evaluator links.
          Use{" "}
          <code className="rounded bg-zinc-200/80 px-1 text-xs dark:bg-zinc-800">
            ?session=…
          </code>{" "}
          when the session is not the default room.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/30">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Session
        </h2>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Session slug
          <input
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            placeholder="e.g. acme-q1-2026"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void openSession()}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Open
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void onCreateSession()}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          >
            Create session
          </button>
        </div>
        {activeSlug ? (
          <p className="text-xs text-zinc-500">
            Active:{" "}
            <code className="text-zinc-800 dark:text-zinc-200">{activeSlug}</code>
            {session === undefined ? " — loading…" : null}
            {session === null ? " — not found (create or fix slug)" : null}
          </p>
        ) : null}
      </section>

      {session && sessionId ? (
        <>
          <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 px-4 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Session title
            </h2>
            <div className="flex flex-wrap gap-2">
              <input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                placeholder="Team or round name"
                className="min-w-[200px] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <button
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  run("title", () =>
                    updateSessionTitle({
                      sessionId,
                      title: titleDraft,
                      managerKey: effectiveManagerKey,
                    }),
                  )
                }
                className="rounded-lg bg-violet-700 px-3 py-2 text-sm font-medium text-white"
              >
                Save title
              </button>
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 px-4 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Roster preset
            </h2>
            <button
              type="button"
              disabled={busy !== null || session.phase === "finished"}
              onClick={() =>
                run("seed", () =>
                  seedRoster({
                    sessionId,
                    title: BURGER_TEAM_TITLE,
                    entries: BURGER_ROSTER.map(({ slug, name, role }) => ({
                      slug,
                      name,
                      role,
                    })),
                    managerKey: effectiveManagerKey,
                  }),
                )
              }
              className="w-fit rounded-lg border border-amber-600/50 bg-amber-500/15 px-3 py-2 text-sm font-medium text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100"
            >
              {busy === "seed" ? "Seeding…" : `Seed “${BURGER_TEAM_TITLE}” team`}
            </button>
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 px-4 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Add person
            </h2>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                value={addSlug}
                onChange={(e) => setAddSlug(e.target.value)}
                placeholder="url slug"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Display name"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <select
                value={addRole}
                onChange={(e) =>
                  setAddRole(e.target.value as "evaluator" | "manager")
                }
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="evaluator">Evaluator</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                run("add", () =>
                  upsertRosterUser({
                    sessionId,
                    slug: addSlug,
                    name: addName,
                    role: addRole,
                    managerKey: effectiveManagerKey,
                  }),
                )
              }
              className="w-fit rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Add / update
            </button>
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 px-4 py-4 dark:border-zinc-800">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Roster & links
              </h2>
              {evalLinks.length > 0 ? (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    void copyText(evalLinks.map((x) => x.href).join("\n"))
                  }
                  className="text-xs font-medium text-violet-700 underline dark:text-violet-400"
                >
                  Copy all evaluator URLs
                </button>
              ) : null}
            </div>
            {roster === undefined ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : roster.length === 0 ? (
              <p className="text-sm text-zinc-500">No people yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {roster.map((u: Doc<"users">) => {
                  const linkRow = evalLinks.find(
                    (x) => x.user._id === u._id,
                  );
                  return (
                    <li
                      key={u._id}
                      className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">
                          {u.name}{" "}
                          <span className="text-xs font-normal text-zinc-500">
                            · {u.slug} · {u.role}
                          </span>
                        </p>
                        {linkRow ? (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <code className="max-w-full break-all text-[11px] text-zinc-600 dark:text-zinc-400">
                              {linkRow.href}
                            </code>
                            <button
                              type="button"
                              className="text-xs text-violet-700 underline dark:text-violet-400"
                              onClick={() => void copyText(linkRow.href)}
                            >
                              Copy
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        disabled={busy !== null || session.phase === "finished"}
                        onClick={() =>
                          run("remove", () =>
                            removeRosterUser({
                              sessionId,
                              userId: u._id as Id<"users">,
                              managerKey: effectiveManagerKey,
                            }),
                          )
                        }
                        className="shrink-0 text-xs text-red-600 underline dark:text-red-400"
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400">
            <p className="font-medium text-zinc-800 dark:text-zinc-200">
              Manager links (this session)
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              <li>
                Control room — use{" "}
                <code className="rounded bg-white px-1 dark:bg-zinc-950">
                  ?session={activeSlug}
                </code>{" "}
                in the URL when not using the default room.
              </li>
              <li>
                Open from the sidebar on any{" "}
                <code className="rounded bg-white px-1 dark:bg-zinc-950">
                  /room/*
                </code>{" "}
                page after you pick a session once.
              </li>
            </ul>
          </section>
        </>
      ) : null}

      {formError ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">
          {formError}
        </p>
      ) : null}
    </div>
  );
}
