import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { AuthScreen } from "./auth-screen";

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  // Someone already signed in has nothing to do on these screens: send them to
  // their pets. Also a safety net if the client-side redirect after signing in
  // doesn't happen (seen on mobile).
  if (path === "sign-in" || path === "sign-up") {
    const { data: session } = await auth.getSession();
    if (session?.user) redirect("/pets");
  }
  return <AuthScreen path={path} />;
}
