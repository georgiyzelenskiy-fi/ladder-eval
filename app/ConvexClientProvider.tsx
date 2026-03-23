"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return (
      <>
        {children}
        {/* Set NEXT_PUBLIC_CONVEX_URL after `npx convex dev` prints your deployment URL. */}
      </>
    );
  }
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
