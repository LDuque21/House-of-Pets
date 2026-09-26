import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@neondatabase/auth-ui";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <main className="text-center">
        <h1 className="text-2xl font-semibold">House of Pets</h1>
        <p className="mt-2 text-zinc-500">Scaffold running. Build starts here.</p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <SignedOut>
            <Link href="/auth/sign-in" className="underline">
              Sign in
            </Link>
            <Link href="/auth/sign-up" className="underline">
              Sign up
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/account" className="underline">
              Account
            </Link>
            <UserButton size="icon" />
          </SignedIn>
        </div>
      </main>
    </div>
  );
}
