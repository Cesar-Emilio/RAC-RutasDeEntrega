"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AdminLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <RequireAuth roles={["admin"]}>{children}</RequireAuth>;
}
