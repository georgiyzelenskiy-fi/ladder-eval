import { InsightsRouteWorkspaceShell } from "@/components/eval/InsightsRouteWorkspaceShell";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "../../eval/eval-workspace.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default async function InsightsSubjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ subjectSlug: string }>;
}) {
  const { subjectSlug } = await params;

  return (
    <div className={`${inter.variable}`}>
      <InsightsRouteWorkspaceShell subjectSlug={subjectSlug}>
        {children}
      </InsightsRouteWorkspaceShell>
    </div>
  );
}
