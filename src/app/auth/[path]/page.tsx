"use client";

import { AuthView } from "@neondatabase/auth-ui";
import { use } from "react";

export default function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = use(params);
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <AuthView path={path} />
    </div>
  );
}
