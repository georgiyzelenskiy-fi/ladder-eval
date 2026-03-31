"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { EvalWorkspaceShell } from "./EvalWorkspaceShell";
import { useRoomLinkSessionSlug } from "./useRoomLinkSessionSlug";

export function InsightsRouteWorkspaceShell({
  subjectSlug,
  children,
}: {
  subjectSlug: string;
  children: ReactNode;
}) {
  const sessionSlug = useRoomLinkSessionSlug();
  const sessionRow = useQuery(api.session.getSession, {
    slug: sessionSlug,
  });
  const roster = useQuery(
    api.users.listUsers,
    sessionRow?._id ? { sessionId: sessionRow._id } : "skip",
  );
  const subjectUser = roster?.find((u) => u.slug === subjectSlug);

  return (
    <EvalWorkspaceShell
      variant="insights"
      subjectSlug={subjectSlug}
      sessionSlug={sessionSlug}
      subjectDisplayName={subjectUser?.name}
    >
      {children}
    </EvalWorkspaceShell>
  );
}
