"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { EvalWorkspaceShell } from "./EvalWorkspaceShell";
import { useRoomLinkSessionSlug } from "./useRoomLinkSessionSlug";

function HomeWorkspaceShellInner({ children }: { children: ReactNode }) {
  const roomSessionSlug = useRoomLinkSessionSlug();
  return (
    <EvalWorkspaceShell
      variant="room"
      headerTitle="Overview"
      roomSessionSlug={roomSessionSlug}
    >
      {children}
    </EvalWorkspaceShell>
  );
}

function HomeShellFallback() {
  return (
    <div className="eval-workspace flex min-h-screen items-center justify-center bg-surface text-on-surface">
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        Loading…
      </p>
    </div>
  );
}

/** Client shell for `/` — same chrome as `/room/*` and `/manage`. */
export function HomeWorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<HomeShellFallback />}>
      <HomeWorkspaceShellInner>{children}</HomeWorkspaceShellInner>
    </Suspense>
  );
}
