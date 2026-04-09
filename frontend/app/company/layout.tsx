"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth roles={["company"]}>{children}</RequireAuth>;
}
