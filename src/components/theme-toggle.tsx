"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@neondatabase/auth-ui";
import { buttonVariants } from "@/components/ui/button";

const noopSubscribe = () => () => {};

// Light/dark switch. The theme lives in next-themes (inside NeonAuthUIProvider),
// which remembers the choice; it defaults to the OS setting until toggled.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // The server doesn't know the theme; render the neutral icon until hydrated.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const dark = hydrated && resolvedTheme === "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={buttonVariants({ variant: "ghost", size: "icon-lg", className: "rounded-full" })}
    >
      {dark ? <Sun /> : <Moon />}
    </button>
  );
}
