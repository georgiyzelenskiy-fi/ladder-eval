import { EvalWorkspaceShell } from "@/components/eval/EvalWorkspaceShell";
import { Inter } from "next/font/google";
import "../eval-workspace.css";
import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default async function EvalSlugLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className={`${inter.variable}`}>
      <EvalWorkspaceShell slug={slug}>{children}</EvalWorkspaceShell>
    </div>
  );
}
