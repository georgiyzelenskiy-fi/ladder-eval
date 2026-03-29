"use client";

import { parseSessionSlugParam } from "@/lib/session-slug-param";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { EvalWorkspaceShell } from "./EvalWorkspaceShell";

/**
 * Shared chrome for `/room/*` routes (control room, live calibration).
 * Matches `/eval/[slug]` workspace shell for layout consistency.
 */
export function RoomWorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roomSessionSlug = parseSessionSlugParam(searchParams.get("session"));

  const headerTitle = pathname.startsWith("/room/live-evaluation")
    ? "Live group calibration"
    : "Control room";

  const contentWrapperClassName = pathname.startsWith("/room/live-evaluation")
    ? "flex min-h-0 flex-1 flex-col overflow-hidden p-0"
    : "space-y-8 p-8";

  return (
    <EvalWorkspaceShell
      variant="room"
      headerTitle={headerTitle}
      roomSessionSlug={roomSessionSlug}
      contentWrapperClassName={contentWrapperClassName}
    >
      {children}
    </EvalWorkspaceShell>
  );
}
