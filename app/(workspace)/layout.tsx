import { HomeWorkspaceShell } from "@/components/eval/HomeWorkspaceShell";
import { Inter } from "next/font/google";
import "../eval/eval-workspace.css";
import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function WorkspaceHomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className={inter.variable}>
      <HomeWorkspaceShell>{children}</HomeWorkspaceShell>
    </div>
  );
}
