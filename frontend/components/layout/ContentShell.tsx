"use client";

import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

type ContentShellProps = {
  role: "admin" | "company";
  title: string;
  breadcrumbs: string[];
  children: ReactNode;
};

export function ContentShell({
  role,
  title,
  breadcrumbs,
  children,
}: ContentShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-white">
      <div className="flex min-h-screen w-full">
        <Sidebar role={role} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Navbar title={title} breadcrumbs={breadcrumbs} />
          <main className="flex-1 px-6 py-6 sm:px-8 sm:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
