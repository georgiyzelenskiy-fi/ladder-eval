"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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
};

export function EvalWorkspaceShell({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const evalPath = `/eval/${slug}`;
  const onEval = pathname === evalPath;

  const mainNav: NavItem[] = [
    { href: "/", label: "Dashboard", icon: "dashboard" },
    { href: evalPath, label: "Skill Matrix", icon: "hub" },
    { href: "/room/driver", label: "Control room", icon: "analytics" },
    { href: "#", label: "Team Insights", icon: "group", disabled: true },
    { href: "#", label: "Repository", icon: "terminal", disabled: true },
  ];

  return (
    <div className="eval-workspace min-h-screen bg-surface text-on-surface antialiased">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col gap-2 bg-surface-container-low py-6 eval-workspace-scroll overflow-y-auto">
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
            const active = !item.disabled && item.href === evalPath && onEval;
            const isDashboard = !item.disabled && item.href === "/" && pathname === "/";
            const isDriver =
              !item.disabled &&
              item.href === "/room/driver" &&
              (pathname.startsWith("/room/driver") ||
                pathname.startsWith("/room/live-evaluation"));
            const highlighted = active || isDashboard || isDriver;

            if (item.disabled) {
              return (
                <span
                  key={item.label}
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
                key={item.href}
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

      <main className="min-h-screen ml-64">
        <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant/15 bg-surface/80 px-8 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="h-8 w-0.5 bg-primary" aria-hidden />
            <h1 className="font-sans text-xs font-bold uppercase tracking-widest text-on-surface">
              Evaluation workspace:{" "}
              <span className="text-primary">{humanizeSlug(slug)}</span>
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
                {humanizeSlug(slug).charAt(0) || "?"}
              </div>
            </div>
          </div>
        </header>
        <div className="space-y-8 p-8">{children}</div>
      </main>
    </div>
  );
}
