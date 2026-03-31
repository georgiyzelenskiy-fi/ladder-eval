"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useStoredManagerAccessKey } from "@/lib/devsync-browser";
import { useRegisteredRosterMemberId } from "@/lib/use-registered-evaluator-id";
import {
  buildEvalHref,
  buildInsightsHref,
  buildRoomHref,
} from "@/lib/room-url";
import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useEvalMatrixChrome } from "./EvalMatrixChromeContext";
import { useLastJoinedEvalSlug } from "./useLastJoinedEvalSlug";

function humanizeSlug(slug: string) {
  return slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type SessionPhase = "preparation" | "live" | "finished";

function sessionHeaderPill(
  sessionRow: { phase: SessionPhase } | null | undefined,
  slug: string,
): {
  dotClassName: string;
  dotPulse: boolean;
  phaseUpper: string;
  title: string;
} {
  if (sessionRow === undefined) {
    return {
      dotClassName: "bg-on-surface-variant",
      dotPulse: false,
      phaseUpper: "Loading",
      title: `Session “${slug}” — loading`,
    };
  }
  if (sessionRow === null) {
    return {
      dotClassName: "bg-warning",
      dotPulse: false,
      phaseUpper: "Unavailable",
      title: `Session “${slug}” — not found yet`,
    };
  }
  const { phase } = sessionRow;
  if (phase === "live") {
    return {
      dotClassName: "bg-success",
      dotPulse: true,
      phaseUpper: "Live",
      title: `Session “${slug}” — live`,
    };
  }
  if (phase === "preparation") {
    return {
      dotClassName: "bg-warning",
      dotPulse: false,
      phaseUpper: "Preparation",
      title: `Session “${slug}” — preparation`,
    };
  }
  return {
    dotClassName: "bg-on-surface-variant",
    dotPulse: false,
    phaseUpper: "Finished",
    title: `Session “${slug}” — finished`,
  };
}

type NavItem = {
  href: string;
  label: string;
  icon: string;
  disabled?: boolean;
  disabledTitle?: string;
};

const LIVE_CAL_PATH = "/room/live-evaluation";
const DRIVER_PATH = "/room/driver";
const MANAGE_PATH = "/manage";

function pathOnly(href: string) {
  const i = href.indexOf("?");
  return i === -1 ? href : href.slice(0, i);
}

/** Manager (access key or roster role): per-roster-member insights links. Otherwise single link from matrix subject or current insights URL. */
function WorkspaceInsightsNav({
  roomSessionSlug,
  pathname,
  showSubjectPicker,
  roster,
  singleSubjectHref,
}: {
  roomSessionSlug: string;
  pathname: string;
  showSubjectPicker: boolean;
  roster: Doc<"users">[] | undefined;
  singleSubjectHref: string | null;
}) {
  const [pickerOpen, setPickerOpen] = useState(() =>
    pathname.startsWith("/insights/"),
  );

  const rosterSorted = useMemo(() => {
    if (!roster?.length) return [];
    return [...roster].sort((a, b) => a.slug.localeCompare(b.slug));
  }, [roster]);

  if (showSubjectPicker && rosterSorted.length > 0) {
    const anyInsightsActive = pathname.startsWith("/insights/");
    return (
      <div className="space-y-0">
        <button
          type="button"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen((o) => !o)}
          className={`flex w-full items-center gap-4 px-6 py-3 text-left transition-all duration-200 ease-in-out ${
            anyInsightsActive && pickerOpen
              ? "border-r-2 border-primary bg-primary/10 text-primary"
              : "text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-xl">bubble_chart</span>
          <span className="flex-1 text-sm font-medium uppercase tracking-widest">
            Subject insights
          </span>
          <span
            className={`material-symbols-outlined text-lg transition-transform ${pickerOpen ? "rotate-180" : ""}`}
            aria-hidden
          >
            expand_more
          </span>
        </button>
        {pickerOpen ? (
          <ul className="border-l-2 border-primary/25 py-1 pl-2 ml-6 space-y-0.5">
            {rosterSorted.map((u) => {
              const href = buildInsightsHref(u.slug, roomSessionSlug);
              const p = pathOnly(href);
              const active = pathname === p;
              return (
                <li key={u._id}>
                  <Link
                    href={href}
                    className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-xs font-medium uppercase tracking-wide transition-colors ${
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-on-surface"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate normal-case tracking-normal">
                      {u.name}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] font-normal opacity-70">
                      {u.slug}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    );
  }

  if (singleSubjectHref == null) return null;
  const singlePath = pathOnly(singleSubjectHref);
  const highlighted = pathname === singlePath;

  return (
    <Link
      href={singleSubjectHref}
      className={`flex items-center gap-4 px-6 py-3 transition-all duration-200 ease-in-out ${
        highlighted
          ? "border-r-2 border-primary bg-primary/10 text-primary"
          : "text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface"
      }`}
    >
      <span className="material-symbols-outlined text-xl">bubble_chart</span>
      <span className="text-sm font-medium uppercase tracking-widest">
        Subject insights
      </span>
    </Link>
  );
}

type EvalVariantProps = {
  variant?: "eval";
  slug: string;
  /** Scopes `/room/*` nav links and `lastEvalSlugStorageKey` (same as `?session=` on `/eval/*`). */
  sessionSlug: string;
  children: ReactNode;
  contentWrapperClassName?: string;
};

type RoomVariantProps = {
  variant: "room";
  headerTitle: string;
  /** From `?session=` on `/room/*`; scopes storage and deep links. */
  roomSessionSlug: string;
  children: ReactNode;
  contentWrapperClassName?: string;
  /** If set, Skill matrix links to this evaluator slug. */
  skillMatrixSlug?: string;
};

type InsightsVariantProps = {
  variant: "insights";
  /** Subject under review (`users.slug`). */
  subjectSlug: string;
  sessionSlug: string;
  /** Resolved display name from roster (optional). */
  subjectDisplayName?: string;
  children: ReactNode;
  contentWrapperClassName?: string;
};

export type EvalWorkspaceShellProps =
  | EvalVariantProps
  | RoomVariantProps
  | InsightsVariantProps;

export function EvalWorkspaceShell(props: EvalWorkspaceShellProps) {
  const pathname = usePathname();
  const storedManagerKey = useStoredManagerAccessKey();
  const matrixChrome = useEvalMatrixChrome();
  const isRoom = props.variant === "room";
  const isInsights = props.variant === "insights";
  const roomSessionSlug =
    props.variant === "room"
      ? props.roomSessionSlug
      : props.sessionSlug;
  const liveCalHref = useMemo(
    () => buildRoomHref(LIVE_CAL_PATH, roomSessionSlug, storedManagerKey),
    [roomSessionSlug, storedManagerKey],
  );
  const driverHref = useMemo(
    () => buildRoomHref(DRIVER_PATH, roomSessionSlug, storedManagerKey),
    [roomSessionSlug, storedManagerKey],
  );
  const manageHref = useMemo(() => {
    if (!storedManagerKey) return MANAGE_PATH;
    return `${MANAGE_PATH}?k=${encodeURIComponent(storedManagerKey)}`;
  }, [storedManagerKey]);
  const lastJoinedEvalSlug = useLastJoinedEvalSlug(roomSessionSlug);
  const sessionRow = useQuery(api.session.getSession, {
    slug: roomSessionSlug,
  });
  const roster = useQuery(
    api.users.listUsers,
    sessionRow?._id ? { sessionId: sessionRow._id } : "skip",
  );
  const registeredRosterMemberId = useRegisteredRosterMemberId(
    roomSessionSlug,
    roster,
  );
  const registeredMemberIsManager =
    registeredRosterMemberId != null &&
    roster?.some(
      (u) => u._id === registeredRosterMemberId && u.role === "manager",
    ) === true;
  const showInsightsSubjectPicker =
    Boolean(storedManagerKey) || registeredMemberIsManager;
  const sessionPill = useMemo(
    () => sessionHeaderPill(sessionRow, roomSessionSlug),
    [sessionRow, roomSessionSlug],
  );
  const evalSlug =
    props.variant === "room" || isInsights ? null : props.slug;
  const roomHeaderTitle =
    props.variant === "room"
      ? props.headerTitle
      : isInsights
        ? (props.subjectDisplayName ?? humanizeSlug(props.subjectSlug))
        : null;
  const roomSkillMatrixSlug =
    props.variant === "room" ? props.skillMatrixSlug : undefined;

  const matrixSlugForNav: string | null =
    props.variant === "eval"
      ? props.slug
      : isRoom
        ? (roomSkillMatrixSlug ?? lastJoinedEvalSlug) ?? null
        : isInsights
          ? lastJoinedEvalSlug
          : null;

  const skillMatrixHref =
    matrixSlugForNav != null
      ? buildEvalHref(matrixSlugForNav, roomSessionSlug)
      : null;

  const skillMatrixPathname =
    matrixSlugForNav != null ? `/eval/${matrixSlugForNav}` : null;

  const insightsRouteSubjectSlug =
    props.variant === "insights" ? props.subjectSlug : undefined;

  /** Insights URL for the subject in the path (`/insights/...`) or matrix subject dropdown; always scoped to `roomSessionSlug` (see `?session=` + Convex bundle). */
  const subjectInsightsHref = useMemo(() => {
    if (isRoom) return null;
    if (insightsRouteSubjectSlug != null) {
      return buildInsightsHref(insightsRouteSubjectSlug, roomSessionSlug);
    }
    const chrome = matrixChrome;
    if (!chrome) return null;
    const su = chrome.roster.find(
      (u) => u._id === chrome.selectedSubjectId,
    );
    return su ? buildInsightsHref(su.slug, roomSessionSlug) : null;
  }, [isRoom, insightsRouteSubjectSlug, matrixChrome, roomSessionSlug]);

  const skillMatrixNav: NavItem[] =
    skillMatrixHref != null
      ? [{ href: skillMatrixHref, label: "Skill matrix", icon: "hub" }]
      : [];

  const mainNavHead: NavItem[] = [
    { href: "/", label: "Home", icon: "home" },
    ...skillMatrixNav,
  ];

  const mainNavTail: NavItem[] = [
    ...(isRoom
      ? ([
          {
            href: manageHref,
            label: "Team setup",
            icon: "group_add",
          },
        ] satisfies NavItem[])
      : []),
    { href: driverHref, label: "Control room", icon: "analytics" },
    { href: liveCalHref, label: "Live calibration", icon: "groups" },
  ];

  const headerAccent =
    isInsights ? (
      <>
        <span className="text-on-surface-variant">Insights ·</span>{" "}
        <span className="text-primary">
          {props.subjectDisplayName ?? humanizeSlug(props.subjectSlug)}
        </span>
      </>
    ) : evalSlug != null ? (
      <span className="text-primary">{humanizeSlug(evalSlug)}</span>
    ) : (
      <span className="text-on-surface">{roomHeaderTitle ?? ""}</span>
    );

  const avatarLetter = (() => {
    if (matrixChrome?.signedInName) {
      const t = matrixChrome.signedInName.trim();
      return t ? t.charAt(0).toUpperCase() : "?";
    }
    if (!isRoom && !isInsights && evalSlug != null) {
      const h = humanizeSlug(evalSlug);
      return h ? h.charAt(0).toUpperCase() : "?";
    }
    if (isInsights) {
      const t = (props.subjectDisplayName ?? props.subjectSlug).trim();
      return t ? t.charAt(0).toUpperCase() : "?";
    }
    const t = roomHeaderTitle?.trim();
    return t ? t.charAt(0).toUpperCase() : "?";
  })();

  const avatarTitle = matrixChrome?.signedInName?.trim() || undefined;
  const avatarHoverLabel =
    avatarTitle ??
    (!isRoom && !isInsights && evalSlug != null
      ? humanizeSlug(evalSlug)
      : undefined) ??
    (isInsights
      ? (props.subjectDisplayName ?? humanizeSlug(props.subjectSlug))
      : undefined) ??
    (roomHeaderTitle?.trim() ? roomHeaderTitle.trim() : undefined);

  const contentClass =
    props.contentWrapperClassName ?? "space-y-8 p-8";

  return (
    <div className="eval-workspace min-h-screen bg-surface text-on-surface antialiased">
      <aside className="eval-workspace-scroll fixed left-0 top-0 z-40 flex h-screen w-64 flex-col gap-2 overflow-y-auto bg-surface-container-low py-6">
        <div className="mb-8 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-container">
              <span className="material-symbols-outlined text-sm text-on-primary-container">
                hub
              </span>
            </div>
            <div>
              <p className="text-lg font-black leading-none text-primary">
                DevSync
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                Skill matrix
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col space-y-1">
          {mainNavHead.map((item) => {
            const isHome =
              !item.disabled && item.href === "/" && pathname === "/";
            const isSkillMatrix =
              !item.disabled &&
              item.label === "Skill matrix" &&
              skillMatrixPathname != null &&
              pathname === skillMatrixPathname;
            const highlighted = isHome || isSkillMatrix;

            if (item.disabled) {
              return (
                <span
                  key={item.label}
                  title={item.disabledTitle}
                  className="flex cursor-not-allowed items-center gap-4 px-6 py-3 text-on-surface-variant/50"
                >
                  <span className="material-symbols-outlined text-xl">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium uppercase tracking-widest">
                    {item.label}
                  </span>
                </span>
              );
            }

            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`flex items-center gap-4 px-6 py-3 transition-all duration-200 ease-in-out ${
                  highlighted
                    ? "border-r-2 border-primary bg-primary/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-xl">
                  {item.icon}
                </span>
                <span className="text-sm font-medium uppercase tracking-widest">
                  {item.label}
                </span>
              </Link>
            );
          })}
          <WorkspaceInsightsNav
            roomSessionSlug={roomSessionSlug}
            pathname={pathname}
            showSubjectPicker={showInsightsSubjectPicker}
            roster={roster}
            singleSubjectHref={subjectInsightsHref}
          />
          {mainNavTail.map((item) => {
            const isControlRoom =
              !item.disabled &&
              pathname.startsWith(DRIVER_PATH) &&
              item.label === "Control room";
            const isLiveCal =
              !item.disabled &&
              item.label === "Live calibration" &&
              pathname.startsWith(LIVE_CAL_PATH);
            const isTeamSetup =
              !item.disabled &&
              item.label === "Team setup" &&
              pathname.startsWith(MANAGE_PATH);

            const highlighted = isControlRoom || isLiveCal || isTeamSetup;

            if (item.disabled) {
              return (
                <span
                  key={item.label}
                  title={item.disabledTitle}
                  className="flex cursor-not-allowed items-center gap-4 px-6 py-3 text-on-surface-variant/50"
                >
                  <span className="material-symbols-outlined text-xl">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium uppercase tracking-widest">
                    {item.label}
                  </span>
                </span>
              );
            }

            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`flex items-center gap-4 px-6 py-3 transition-all duration-200 ease-in-out ${
                  highlighted
                    ? "border-r-2 border-primary bg-primary/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-xl">
                  {item.icon}
                </span>
                <span className="text-sm font-medium uppercase tracking-widest">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-6 pb-6" />
      </aside>

      <main className="ml-64 flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 flex min-h-16 w-full shrink-0 flex-wrap items-center justify-between gap-3 overflow-visible border-b border-outline-variant/15 bg-surface/80 px-6 py-2 backdrop-blur-xl sm:px-8 sm:py-0">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
            {evalSlug != null && matrixChrome ? (
              <div className="flex min-w-0 max-w-md flex-1 items-center gap-3 sm:max-w-lg">
                <div
                  className="h-7 w-0.5 shrink-0 self-center rounded-sm bg-primary"
                  aria-hidden
                />
                <label className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Subject
                  </span>
                  <select
                    className="min-w-0 flex-1 cursor-pointer border-0 border-b border-primary/45 bg-transparent py-1 text-sm font-semibold normal-case tracking-normal text-primary focus:border-primary focus:outline-none focus:ring-0"
                    value={matrixChrome.selectedSubjectId}
                    onChange={(e) =>
                      matrixChrome.onSubjectChange(
                        e.target.value as Id<"users">,
                      )
                    }
                  >
                    {matrixChrome.roster.map((u) => (
                      <option
                        key={u._id}
                        value={u._id}
                        className="bg-surface-container text-on-surface"
                      >
                        {u.name} ({u.slug})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <div className="flex min-w-0 items-start gap-3 sm:items-center">
                <div
                  className="mt-1 h-8 w-0.5 shrink-0 bg-primary sm:mt-0"
                  aria-hidden
                />
                <h1 className="font-sans text-xs font-bold uppercase tracking-widest text-on-surface">
                  {evalSlug != null ? (
                    <>
                      <span className="text-on-surface-variant">
                        Evaluation ·
                      </span>{" "}
                      {headerAccent}
                    </>
                  ) : (
                    <>{headerAccent}</>
                  )}
                </h1>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div
              className="flex max-w-[min(100%,22rem)] items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container px-3 py-1.5"
              title={sessionPill.title}
            >
              <div
                className={`h-2 w-2 shrink-0 rounded-full ${sessionPill.dotClassName} ${sessionPill.dotPulse ? "animate-pulse" : ""}`}
                aria-hidden
              />
              <span className="min-w-0 truncate text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
                <span className="font-mono text-[10px] font-normal normal-case tracking-normal text-on-surface">
                  {roomSessionSlug}
                </span>
                <span className="text-on-surface-variant/45"> · </span>
                {sessionPill.phaseUpper}
              </span>
            </div>
            <div className="flex items-center gap-4 text-on-surface-variant">
              <span
                className="material-symbols-outlined cursor-default text-xl opacity-60"
                aria-hidden
              >
                notifications
              </span>
              <span
                className="material-symbols-outlined cursor-default text-xl opacity-60"
                aria-hidden
              >
                settings
              </span>
              <div className="group relative shrink-0">
                <div
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-primary/20 bg-surface-container-highest text-xs font-bold text-on-surface-variant transition-colors group-hover:border-primary/45 group-hover:bg-surface-container"
                  title={avatarHoverLabel}
                  aria-label={
                    avatarTitle
                      ? `Signed in as ${avatarTitle}`
                      : evalSlug != null
                        ? `Evaluator ${humanizeSlug(evalSlug)}`
                        : isInsights
                          ? `Insights · ${props.subjectDisplayName ?? humanizeSlug(props.subjectSlug)}`
                          : "Workspace"
                  }
                >
                  {avatarLetter}
                </div>
                {avatarHoverLabel ? (
                  <span
                    className="pointer-events-none absolute bottom-[calc(100%-60px)] left-1/2 z-[60] -translate-x-1/2 whitespace-nowrap rounded-md border border-outline-variant/35 bg-surface-container-high px-2.5 py-1 text-[11px] font-medium text-on-surface opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
                    role="tooltip"
                  >
                    {avatarHoverLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </header>
        <div className={`min-h-0 flex-1 ${contentClass}`}>{props.children}</div>
      </main>
    </div>
  );
}
