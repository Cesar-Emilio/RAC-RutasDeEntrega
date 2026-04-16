"use client";

import { useParams } from "next/navigation";
import { RegistrationForm } from "@/components/auth/RegistrationForm";

export default function RegisterPage() {
  const params = useParams();
  const token = params?.token as string | undefined;

  return <RegistrationForm token={token} />;
}
