"use client";

import { AccountView } from "@neondatabase/auth-ui";
import { use } from "react";

// Better Auth UI's account pages (/account/settings, /account/security):
// profile photo, name, email, password. Reached from the profile menu.
export default function AccountPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = use(params);
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <AccountView path={path} />
    </div>
  );
}
