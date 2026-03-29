"use client";

import { useStoredManagerAccessKey } from "@/lib/devsync-browser";
import {
  DEFAULT_SESSION_SLUG,
  DEVSYNC_STORAGE_NOTIFY_EVENT,
  lastEvalSlugStorageKey,
} from "@/lib/devsync-constants";
import { buildRoomHref } from "@/lib/room-url";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useSyncExternalStore } from "react";

function humanizeSlug(slug: string) {
  return slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type NavItem = {
  href: string;
  label: string;
  icon: string;
  disabled?: boolean;
  disabledTitle?: string;
};

function useLastJoinedEvalSlug(sessionSlug: string): string | null {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};
      const onNotify = () => onChange();
      window.addEventListener(DEVSYNC_STORAGE_NOTIFY_EVENT, onNotify);
      window.addEventListener("storage", onNotify);
      return () => {
        window.removeEventListener(DEVSYNC_STORAGE_NOTIFY_EVENT, onNotify);
        window.removeEventListener("storage", onNotify);
      };
    },
    () => {
      try {
        const v = localStorage.getItem(lastEvalSlugStorageKey(sessionSlug));
        return v && v.length > 0 ? v : null;
      } catch {
        return null;
      }
    },
    () => null,
  );
}

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

  const skillMatrixItem: NavItem =
    evalSlug != null
      ? { href: `/eval/${evalSlug}`, label: "Skill matrix", icon: "hub" }
      : skillMatrixHrefForRoom
        ? {
            href: skillMatrixHrefForRoom,
            label: "Skill matrix",
            icon: "hub",
          }
        : {
            href: "#",
            label: "Skill matrix",
            icon: "hub",
            disabled: true,
            disabledTitle:
              "Join via your /eval/your-slug link once in this browser, then this opens your matrix",
          };

  const mainNav: NavItem[] = [
    { href: "/", label: "Dashboard", icon: "dashboard", disabled: true },
    skillMatrixItem,
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
    { href: "#", label: "Team insights", icon: "group", disabled: true },
    { href: "#", label: "Repository", icon: "terminal", disabled: true },
  ];

  const headerAccent =
    evalSlug != null ? (
      <span className="text-primary">{humanizeSlug(evalSlug)}</span>
    ) : (
      <span className="text-on-surface">{roomHeaderTitle ?? ""}</span>
    );

  const avatarLetter =
    evalSlug != null
      ? humanizeSlug(evalSlug).charAt(0) || "?"
      : (roomHeaderTitle?.charAt(0) ?? "?");

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
            const isDashboard =
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
              isDashboard ||
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

        <div className="mt-auto px-6">
          <button
            type="button"
            disabled
            title="Not wired yet"
            className="w-full cursor-not-allowed rounded-lg bg-primary-container py-3 text-xs font-bold uppercase tracking-widest text-on-primary-container opacity-60"
          >
            Submit evaluation
          </button>
          <div className="mt-6 space-y-4 border-t border-outline-variant/20 pt-6">
            <span className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-lg">sensors</span>
              <span className="text-[10px] uppercase tracking-widest">
                System status
              </span>
            </span>
            <Link
              href="/"
              className="flex items-center gap-3 text-on-surface-variant transition-colors hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-lg">menu_book</span>
              <span className="text-[10px] uppercase tracking-widest">
                Documentation
              </span>
            </Link>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b border-outline-variant/15 bg-surface/80 px-8 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-4">
            <div className="h-8 w-0.5 shrink-0 bg-primary" aria-hidden />
            <h1 className="font-sans text-xs font-bold uppercase tracking-widest text-on-surface">
              {evalSlug != null ? (
                <>
                  Evaluation workspace: {headerAccent}
                </>
              ) : (
                <>{headerAccent}</>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container px-3 py-1.5">
              <div
                className="h-2 w-2 animate-pulse rounded-full bg-success"
                aria-hidden
              />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
                Active session
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
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-surface-container-highest text-xs font-bold text-on-surface-variant"
                aria-hidden
              >
                {avatarLetter}
              </div>
            </div>
          </div>
        </header>
        <div className={`min-h-0 flex-1 ${contentClass}`}>{props.children}</div>
      </main>
    </div>
  );
}
