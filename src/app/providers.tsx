"use client";

import { useRouter } from "next/navigation";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth/client";

// The provider renders a wrapper <div> around the whole app; make it a flex
// column so pages inside can grow to fill the screen height.
// avatar: profile photos are resized in the browser and saved on the user
// record as a data: URL (no file storage needed); edited at /account/settings.
// onSessionChange: when someone signs in or out, drop the router's cached
// pages so nothing rendered for the previous account can be shown again.
export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <NeonAuthUIProvider
      authClient={authClient}
      onSessionChange={() => router.refresh()}
      redirectTo="/pets"
      className="flex flex-1 flex-col"
      avatar={{ size: 256, extension: "jpg" }}
      account={{ basePath: "/account", fields: ["image", "name"] }}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
