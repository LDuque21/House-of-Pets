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
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-xl">
          <LogoMark />
          <span className="font-heading text-lg font-semibold tracking-tight">House of Pets</span>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <SignedIn>
            <Link href="/pets" className={buttonVariants({ variant: "ghost", size: "pill" })}>
              Your pets
            </Link>
            <UserButton size="icon" />
          </SignedIn>
          <SignedOut>
            <Link href="/auth/sign-in" className={buttonVariants({ variant: "ghost", size: "pill" })}>
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
