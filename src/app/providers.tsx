"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth/client";

// The provider renders a wrapper <div> around the whole app; make it a flex
// column so pages inside can grow to fill the screen height.
// avatar: profile photos are resized in the browser and saved on the user
// record as a data: URL (no file storage needed); edited at /account/settings.
// No custom navigate/onSessionChange on purpose: the default navigation after
// signing in or out is a full page load, which already drops every cached page
// from the previous account. (An onSessionChange router.refresh() raced that
// redirect and left people on the sign-in page.)
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NeonAuthUIProvider
      authClient={authClient}
      redirectTo="/pets"
      className="flex flex-1 flex-col"
      avatar={{ size: 256, extension: "jpg" }}
      account={{ basePath: "/account", fields: ["image", "name"] }}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
