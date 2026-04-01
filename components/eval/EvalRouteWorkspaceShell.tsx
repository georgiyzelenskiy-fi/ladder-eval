"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { EvalMatrixChromeProvider } from "./EvalMatrixChromeContext";
import { EvalWorkspaceShell } from "./EvalWorkspaceShell";
import { useRoomLinkSessionSlug } from "./useRoomLinkSessionSlug";

function EvalRouteWorkspaceShellInner({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const sessionSlug = useRoomLinkSessionSlug();
  return (
    <EvalMatrixChromeProvider>
      <EvalWorkspaceShell variant="eval" slug={slug} sessionSlug={sessionSlug}>
        {children}
      </EvalWorkspaceShell>
    </EvalMatrixChromeProvider>
  );
}

function EvalShellFallback() {
  return (
    <div className="eval-workspace flex min-h-screen items-center justify-center bg-surface text-on-surface">
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        Loading…
      </p>
    </div>
  );
}

/** Client shell for `/eval/[slug]` — reads `?session=` (and last-visited fallback) for room links. */
export function EvalRouteWorkspaceShell({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<EvalShellFallback />}>
      <EvalRouteWorkspaceShellInner slug={slug}>{children}</EvalRouteWorkspaceShellInner>
    </Suspense>
  );
}
