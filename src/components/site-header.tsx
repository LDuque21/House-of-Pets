import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@neondatabase/auth-ui";
import { PawPrint } from "@/components/animal-silhouettes";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm",
        className
      )}
    >
      <PawPrint className="size-5" />
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 rounded-xl sm:gap-2.5">
          <LogoMark />
          <span className="truncate font-heading text-base font-semibold tracking-tight sm:text-lg">House of Pets</span>
        </Link>
        {/* Phones: "Your pets" shrinks to a paw icon and "Sign in" hides (the sign-up page links to it). */}
        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <SignedIn>
            <Link
              href="/pets"
              aria-label="Your pets"
              className={buttonVariants({ variant: "ghost", size: "pill", className: "max-sm:size-10 max-sm:px-0" })}
            >
              <PawPrint className="size-5 sm:hidden" />
              <span className="max-sm:hidden">Your pets</span>
            </Link>
            <UserButton size="icon" />
          </SignedIn>
          <SignedOut>
            <Link
              href="/auth/sign-in"
              className={buttonVariants({ variant: "ghost", size: "pill", className: "max-sm:hidden" })}
            >
              Sign in
            </Link>
            <Link href="/auth/sign-up" className={buttonVariants({ size: "pill" })}>
              Get started
            </Link>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
