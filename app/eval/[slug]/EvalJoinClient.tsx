"use client";

import { api } from "@/convex/_generated/api";
import { DEFAULT_SESSION_SLUG, STORAGE_USER_ID_KEY } from "@/lib/devsync-constants";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type Props = { slug: string };

function storageKeyForSlug(slug: string) {
  return `${STORAGE_USER_ID_KEY}:${DEFAULT_SESSION_SLUG}:${slug}`;
}

const STORAGE_NOTIFY_EVENT = "devsync-local-storage";

function readStoredUserId(slug: string): Id<"users"> | null {
  try {
    const raw = localStorage.getItem(storageKeyForSlug(slug));
    return raw ? (raw as Id<"users">) : null;
  } catch {
    return null;
  }
}

function notifyLocalStorageListeners() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STORAGE_NOTIFY_EVENT));
}

function useStoredConvexUserId(slug: string): Id<"users"> | null {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};
      const handler = () => onChange();
      window.addEventListener(STORAGE_NOTIFY_EVENT, handler);
      return () => window.removeEventListener(STORAGE_NOTIFY_EVENT, handler);
    },
    () => readStoredUserId(slug),
    () => null,
  );
}

export function EvalJoinClient({ slug }: Props) {
  const ensureSession = useMutation(api.session.ensureSession);
  const joinSession = useMutation(api.users.joinSession);
  const session = useQuery(api.session.getSession, { slug: DEFAULT_SESSION_SLUG });

  const [name, setName] = useState("");
  const [nameDirty, setNameDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedId = useStoredConvexUserId(slug);

  useEffect(() => {
    void ensureSession({ slug: DEFAULT_SESSION_SLUG }).catch(() => {
      /* DriverClient or another tab will surface errors */
    });
  }, [ensureSession]);

  const sessionId = session?._id;
  const existingProfile = useQuery(
    api.users.getUserBySessionSlug,
    sessionId ? { sessionId, slug } : "skip",
  );
  const roster = useQuery(
    api.users.listUsers,
    sessionId ? { sessionId } : "skip",
  );

  const me =
    savedId && roster
      ? roster.find((u: Doc<"users">) => u._id === savedId) ?? null
      : null;

  const onJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!sessionId) {
      setError("Session not ready yet.");
      return;
    }
    const displayName = nameDirty
      ? name
      : (name || existingProfile?.name || "");
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError("Enter your name.");
      return;
    }
    try {
      const userId = await joinSession({
        sessionId,
        slug,
        name: trimmed,
        role: existingProfile?.role ?? "evaluator",
      });
      localStorage.setItem(storageKeyForSlug(slug), userId);
      notifyLocalStorageListeners();
      setName(trimmed);
      setNameDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "joinSession failed");
    }
  };

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Set NEXT_PUBLIC_CONVEX_URL in .env.local and run convex dev.
      </p>
    );
  }

  if (session === undefined) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
    );
  }

  if (session === null) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Connecting to session…
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Evaluator
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Join as{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-lg dark:bg-zinc-800">
            {slug}
          </code>
        </h1>
      </header>

      {me ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as
          </p>
          <p className="mt-1 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {me.name}
          </p>
          <p className="mt-3 text-xs text-zinc-500">
            Matrix UI and prep rules ship in the next slice; your id is stored
            in this browser.
          </p>
        </div>
      ) : (
        <form onSubmit={onJoin} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Display name
            {existingProfile?.name ? (
              <span className="ml-2 text-xs font-normal text-zinc-500">
                (pre-filled from roster)
              </span>
            ) : null}
            <input
              value={
                nameDirty ? name : (name || existingProfile?.name || "")
              }
              onChange={(e) => {
                setNameDirty(true);
                setName(e.target.value);
              }}
              autoComplete="name"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="Your name"
            />
          </label>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Continue
          </button>
        </form>
      )}
    </div>
  );
}
