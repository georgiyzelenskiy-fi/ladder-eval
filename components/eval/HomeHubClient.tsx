"use client";

import { useStoredManagerAccessKey } from "@/lib/devsync-browser";
import { DEFAULT_SESSION_SLUG } from "@/lib/devsync-constants";
import { buildRoomHref } from "@/lib/room-url";
import Link from "next/link";
import { useMemo } from "react";
import { useLastJoinedEvalSlug } from "./useLastJoinedEvalSlug";
import { useRoomLinkSessionSlug } from "./useRoomLinkSessionSlug";

const DRIVER_PATH = "/room/driver";
const LIVE_CAL_PATH = "/room/live-evaluation";
const MANAGE_PATH = "/manage";

type HubCardProps = {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
  accent?: "default" | "primary";
};

function HubCard({ href, icon, title, subtitle, accent = "default" }: HubCardProps) {
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-xl border bg-surface-container-high p-6 transition-all duration-200 ease-out ${
        accent === "primary"
          ? "border-primary/25 shadow-[0_0_0_1px_rgba(94,180,255,0.08)] hover:border-primary/45 hover:shadow-[0_0_24px_-8px_rgba(94,180,255,0.35)]"
          : "border-outline-variant/25 hover:border-primary/30 hover:bg-surface-container"
      }`}
    >
      <div
        className={`absolute left-0 top-0 h-full w-1 transition-colors ${
          accent === "primary" ? "bg-primary/60" : "bg-primary/0 group-hover:bg-primary/70"
        }`}
        aria-hidden
      />
      <div className="pl-3">
        <span className="material-symbols-outlined text-3xl text-primary">{icon}</span>
        <h2 className="mt-4 text-[11px] font-black uppercase tracking-[0.2em] text-on-surface">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{subtitle}</p>
        <span className="mt-5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary transition-transform duration-200 group-hover:translate-x-0.5">
          Open
          <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-0.5">
            arrow_forward
          </span>
        </span>
      </div>
    </Link>
  );
}

export function HomeHubClient() {
  const sessionSlug = useRoomLinkSessionSlug();
  const storedManagerKey = useStoredManagerAccessKey();
  const lastEvalSlug = useLastJoinedEvalSlug(sessionSlug);

  const manageHref = useMemo(() => {
    if (!storedManagerKey) return MANAGE_PATH;
    return `${MANAGE_PATH}?k=${encodeURIComponent(storedManagerKey)}`;
  }, [storedManagerKey]);

  const driverHref = useMemo(
    () => buildRoomHref(DRIVER_PATH, sessionSlug, storedManagerKey),
    [sessionSlug, storedManagerKey],
  );

  const liveCalHref = useMemo(
    () => buildRoomHref(LIVE_CAL_PATH, sessionSlug, storedManagerKey),
    [sessionSlug, storedManagerKey],
  );

  const skillMatrixHref = useMemo(() => {
    if (!lastEvalSlug) return null;
    const u = new URLSearchParams();
    if (sessionSlug !== DEFAULT_SESSION_SLUG) {
      u.set("session", sessionSlug);
    }
    const q = u.toString();
    return q ? `/eval/${lastEvalSlug}?${q}` : `/eval/${lastEvalSlug}`;
  }, [lastEvalSlug, sessionSlug]);

  return (
    <div className="min-h-full bg-surface-container text-on-background">
      <section className="border-b border-outline-variant/15 bg-surface-container-low/80 px-6 py-10 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant">
            DevSync
          </p>
          <h1 className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-on-surface sm:text-3xl">
            Prepare, reveal, calibrate
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
            Structured 360° skill reviews: managers set up rounds and room links; evaluators prepare
            privately; the live room drives sequential reveal and team calibration against the
            matrix.
          </p>
          <div className="mt-6 flex max-w-2xl flex-col gap-3 rounded-xl border border-outline-variant/25 bg-surface-container-high px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
            <span className="material-symbols-outlined shrink-0 text-lg text-primary">tag</span>
            <div className="min-w-0 text-left">
              <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                Linked session
              </p>
              <p className="truncate font-mono text-xs text-on-surface">{sessionSlug}</p>
            </div>
            <p className="text-[10px] leading-snug text-on-surface-variant/80 sm:border-l sm:border-outline-variant/25 sm:pl-4">
              Sidebar and deep links use this. Override with{" "}
              <code className="rounded bg-surface-container px-1 font-mono text-[10px] text-primary">
                ?session=
              </code>{" "}
              on any URL.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <div className="mb-8 flex items-end justify-between gap-4 border-b border-outline-variant/15 pb-4">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
              Workspace
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Manager flows first; evaluators use personal links from team setup.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <HubCard
            href={manageHref}
            icon="group_add"
            title="Team setup"
            subtitle="Create or open a session, edit the roster, and copy evaluator URLs (with optional session slug)."
            accent="primary"
          />
          <HubCard
            href={driverHref}
            icon="analytics"
            title="Control room"
            subtitle="Session phase, prep progress, active evaluator, and verdict — the manager cockpit before and between live runs."
          />
          <HubCard
            href={liveCalHref}
            icon="groups"
            title="Live calibration"
            subtitle="Sequential reveal, discussion, calibration marks, and matrix context for the whole group."
          />
          {skillMatrixHref ? (
            <HubCard
              href={skillMatrixHref}
              icon="hub"
              title="Skill matrix"
              subtitle="Return to the matrix for this browser’s last evaluator link in this session."
            />
          ) : null}
        </div>

        <aside className="mt-12 rounded-xl border border-outline-variant/20 bg-surface-container-high/50 p-5 sm:p-6">
          <div className="flex flex-wrap items-start gap-3">
            <span className="material-symbols-outlined shrink-0 text-xl text-on-surface-variant">
              info
            </span>
            <div className="min-w-0 text-sm leading-relaxed text-on-surface-variant">
              <p className="font-semibold text-on-surface">Evaluators</p>
              <p className="mt-1">
                No sign-in hub here — open the unique URL from team setup (it may include{" "}
                <code className="rounded bg-surface-container px-1 font-mono text-xs text-primary">
                  ?session=
                </code>
                ). This app stores your last matrix per session for sidebar shortcuts.
              </p>
              <p className="mt-3 text-xs text-on-surface-variant/80">
                Optional manager gate: set{" "}
                <code className="rounded bg-surface-container px-1 font-mono text-[10px]">
                  MANAGER_ACCESS_KEY
                </code>{" "}
                and visit manage or room URLs once with{" "}
                <code className="rounded bg-surface-container px-1 font-mono text-[10px]">?k=…</code>{" "}
                — the browser remembers it for sidebar links.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
