import { auth } from "@/lib/auth/server";

export default async function AccountPage() {
  const { data: session } = await auth.getSession();
  const user = session?.user;

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Signed in</h1>
        <p className="mt-2 text-zinc-500">{user?.email}</p>
      </div>
    </div>
  );
}
