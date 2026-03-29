import { RoomWorkspaceShell } from "@/components/eval/RoomWorkspaceShell";
import { Inter } from "next/font/google";
import "../eval/eval-workspace.css";
import type { ReactNode } from "react";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

function RoomShellFallback() {
  return (
    <div className="eval-workspace flex min-h-screen items-center justify-center bg-surface text-on-surface">
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        Loading…
      </p>
    </div>
  );
}

export default function RoomLayout({ children }: { children: ReactNode }) {
  return (
    <div className={inter.variable}>
      <Suspense fallback={<RoomShellFallback />}>
        <RoomWorkspaceShell>{children}</RoomWorkspaceShell>
      </Suspense>
    </div>
  );
}
