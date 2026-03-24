"use client";

import { api } from "@/convex/_generated/api";
import {
  DEFAULT_SESSION_SLUG,
  DEVSYNC_STORAGE_NOTIFY_EVENT,
  evaluatorUserIdStorageKey,
  LAST_EVAL_SLUG_STORAGE_KEY,
} from "@/lib/devsync-constants";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { EvaluatorMatrix } from "./EvaluatorMatrix";

type Props = { slug: string };

function readStoredUserId(slug: string): Id<"users"> | null {
  try {
    const raw = localStorage.getItem(evaluatorUserIdStorageKey(slug));
    return raw ? (raw as Id<"users">) : null;
  } catch {
    return null;
  }
}

function notifyLocalStorageListeners() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DEVSYNC_STORAGE_NOTIFY_EVENT));
}

function useStoredConvexUserId(slug: string): Id<"users"> | null {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};
      const handler = () => onChange();
      window.addEventListener(DEVSYNC_STORAGE_NOTIFY_EVENT, handler);
      return () =>
        window.removeEventListener(DEVSYNC_STORAGE_NOTIFY_EVENT, handler);
    },
    () => readStoredUserId(slug),
    () => null,
  );
}

const terminalInputClass =
  "mt-1 w-full border-0 border-b border-outline-variant bg-surface-container-low px-0 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-0 rounded-sm";

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

  /** Backfill + refresh “last matrix slug” for `/room/*` sidebar when already signed in. */
  useEffect(() => {
    if (!me || typeof window === "undefined") return;
    try {
      localStorage.setItem(LAST_EVAL_SLUG_STORAGE_KEY, slug);
      notifyLocalStorageListeners();
    } catch {
      /* ignore quota / private mode */
    }
  }, [me, slug]);

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
      localStorage.setItem(evaluatorUserIdStorageKey(slug), userId);
      localStorage.setItem(LAST_EVAL_SLUG_STORAGE_KEY, slug);
      notifyLocalStorageListeners();
      setName(trimmed);
      setNameDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "joinSession failed");
    }
  };

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <p className="text-sm text-on-surface-variant">
        Set NEXT_PUBLIC_CONVEX_URL in .env.local and run convex dev.
      </p>
    );
  }

  if (session === undefined) {
    return (
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        Loading…
      </p>
    );
  }

  if (session === null) {
    return (
      <p className="text-sm text-on-surface-variant">
        Connecting to session…
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-6xl flex-col gap-8">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
          Evaluator
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-on-surface">
          Join as{" "}
          <code className="rounded-sm bg-surface-container-high px-2 py-0.5 font-mono text-lg text-primary">
            {slug}
          </code>
        </h2>
      </header>

      {me ? (
        <>
          <div className="max-w-md rounded-xl border border-outline-variant/15 bg-surface-container px-4 py-4 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.35)]">
            <p className="text-sm text-on-surface-variant">Signed in as</p>
            <p className="mt-1 text-lg font-semibold text-on-surface">
              {me.name}
            </p>
            <p className="mt-3 text-xs text-on-surface-variant">
              Your evaluator id is stored in this browser (localStorage).
            </p>
          </div>
          {sessionId ? (
            roster === undefined ? (
              <p className="text-sm text-on-surface-variant">
                Loading roster…
              </p>
            ) : (
              <EvaluatorMatrix
                sessionId={sessionId}
                phase={session.phase}
                activeRevealSkillId={session.activeRevealSkillId}
                myUserId={me._id}
                roster={roster}
              />
            )
          ) : null}
        </>
      ) : (
        <form
          onSubmit={onJoin}
          className="flex max-w-md flex-col gap-4"
        >
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Display name
            {existingProfile?.name ? (
              <span className="ml-2 font-normal normal-case tracking-normal text-on-surface-variant/80">
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
              className={terminalInputClass}
              placeholder="Your name"
            />
          </label>
          {error ? (
            <p className="text-sm text-error">{error}</p>
          ) : null}
          <button
            type="submit"
            className="rounded-md bg-gradient-to-br from-primary to-primary-container px-4 py-2.5 text-sm font-bold text-on-primary shadow-[0_8px_24px_-4px_rgba(94,180,255,0.35)] transition-transform active:scale-[0.98]"
          >
            Continue
          </button>
        </form>
      )}
    </div>
  );
}
