import { RoomWorkspaceShell } from "@/components/eval/RoomWorkspaceShell";
import { Inter } from "next/font/google";
import "../eval/eval-workspace.css";
import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RoomLayout({ children }: { children: ReactNode }) {
  return (
    <div className={inter.variable}>
      <RoomWorkspaceShell>{children}</RoomWorkspaceShell>
    </div>
  );
}
