"use client";

import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

type DashboardShellProps = {
  role: "admin" | "company";
  title: string;
  breadcrumbs: string[];
  children: ReactNode;
};

export function DashboardShell({
  role,
  title,
  breadcrumbs,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#0f1217] text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-[240px_1fr]">
        <Sidebar role={role} />
        <div className="flex min-h-screen flex-col">
          <Navbar title={title} breadcrumbs={breadcrumbs} />
          <main className="flex-1 px-6 py-6 sm:px-8 sm:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
