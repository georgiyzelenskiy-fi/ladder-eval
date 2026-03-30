"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useStoredManagerAccessKey } from "@/lib/devsync-browser";
import { DEFAULT_SESSION_SLUG } from "@/lib/devsync-constants";
import { buildRoomHref } from "@/lib/room-url";
import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo } from "react";
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

export type EvalWorkspaceShellProps = EvalVariantProps | RoomVariantProps;

export function EvalWorkspaceShell(props: EvalWorkspaceShellProps) {
  const pathname = usePathname();
  const storedManagerKey = useStoredManagerAccessKey();
  const isRoom = props.variant === "room";
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
  const sessionPill = useMemo(
    () => sessionHeaderPill(sessionRow, roomSessionSlug),
    [sessionRow, roomSessionSlug],
  );
  const evalSlug = props.variant === "room" ? null : props.slug;
  const roomHeaderTitle = props.variant === "room" ? props.headerTitle : null;
  const roomSkillMatrixSlug =
    props.variant === "room" ? props.skillMatrixSlug : undefined;

  const roomResolvedMatrixSlug =
    isRoom && (roomSkillMatrixSlug ?? lastJoinedEvalSlug)
      ? (roomSkillMatrixSlug ?? lastJoinedEvalSlug)!
      : null;

  const skillMatrixHrefForRoom =
    roomResolvedMatrixSlug != null
      ? (() => {
          const u = new URLSearchParams();
          if (roomSessionSlug !== DEFAULT_SESSION_SLUG) {
            u.set("session", roomSessionSlug);
          }
          const q = u.toString();
          return q
            ? `/eval/${roomResolvedMatrixSlug}?${q}`
            : `/eval/${roomResolvedMatrixSlug}`;
        })()
      : null;

  const evalPath = evalSlug != null ? `/eval/${evalSlug}` : null;
  const onEval = evalPath != null && pathname === evalPath;

  const skillMatrixNav: NavItem[] =
    evalSlug != null
      ? [{ href: `/eval/${evalSlug}`, label: "Skill matrix", icon: "hub" }]
      : skillMatrixHrefForRoom != null
        ? [
            {
              href: skillMatrixHrefForRoom,
              label: "Skill matrix",
              icon: "hub",
            },
          ]
        : [];

  const mainNav: NavItem[] = [
    { href: "/", label: "Home", icon: "home" },
    ...skillMatrixNav,
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
    evalSlug != null ? (
      <span className="text-primary">{humanizeSlug(evalSlug)}</span>
    ) : (
      <span className="text-on-surface">{roomHeaderTitle ?? ""}</span>
    );

  const matrixChrome = useEvalMatrixChrome();

  const avatarLetter = (() => {
    if (matrixChrome?.signedInName) {
      const t = matrixChrome.signedInName.trim();
      return t ? t.charAt(0).toUpperCase() : "?";
    }
    if (!isRoom && evalSlug != null) {
      const h = humanizeSlug(evalSlug);
      return h ? h.charAt(0).toUpperCase() : "?";
    }
    const t = roomHeaderTitle?.trim();
    return t ? t.charAt(0).toUpperCase() : "?";
  })();

  const avatarTitle = matrixChrome?.signedInName?.trim() || undefined;
  const avatarHoverLabel =
    avatarTitle ??
    (!isRoom && evalSlug != null ? humanizeSlug(evalSlug) : undefined) ??
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
          {mainNav.map((item) => {
            const isHome =
              !item.disabled && item.href === "/" && pathname === "/";
            const isSkillMatrix =
              !item.disabled &&
              evalPath != null &&
              item.href === evalPath &&
              onEval;
            const isSkillMatrixRoom =
              !item.disabled &&
              isRoom &&
              skillMatrixHrefForRoom != null &&
              item.href === skillMatrixHrefForRoom &&
              pathname === `/eval/${roomResolvedMatrixSlug}`;
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

            const highlighted =
              isHome ||
              isSkillMatrix ||
              isSkillMatrixRoom ||
              isControlRoom ||
              isLiveCal ||
              isTeamSetup;

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
