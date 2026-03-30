import { ManageWorkspaceShell } from "@/components/eval/ManageWorkspaceShell";
import { Inter } from "next/font/google";
import "../eval/eval-workspace.css";
import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function ManageLayout({ children }: { children: ReactNode }) {
  return (
    <div className={inter.variable}>
      <ManageWorkspaceShell>{children}</ManageWorkspaceShell>
    </div>
  );
}
