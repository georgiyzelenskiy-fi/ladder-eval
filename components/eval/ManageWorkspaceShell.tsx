"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { EvalWorkspaceShell } from "./EvalWorkspaceShell";
import { useRoomLinkSessionSlug } from "./useRoomLinkSessionSlug";

function ManageWorkspaceShellInner({ children }: { children: ReactNode }) {
  const roomSessionSlug = useRoomLinkSessionSlug();
  return (
    <EvalWorkspaceShell
      variant="room"
      headerTitle="Team setup"
      roomSessionSlug={roomSessionSlug}
    >
      {children}
    </EvalWorkspaceShell>
  );
}

function ManageShellFallback() {
  return (
    <div className="eval-workspace flex min-h-screen items-center justify-center bg-surface text-on-surface">
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        Loading…
      </p>
    </div>
  );
}

/** Client shell for `/manage` — same chrome as `/room/*`; session from `?session=` + last-visited fallback. */
export function ManageWorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ManageShellFallback />}>
      <ManageWorkspaceShellInner>{children}</ManageWorkspaceShellInner>
    </Suspense>
  );
}
