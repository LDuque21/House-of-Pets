import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { listPetsForUser } from "@/lib/pets";

export default async function PetsPage() {
  const { data: session } = await auth.getSession();
  const user = session!.user;
  const pets = await listPetsForUser(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your pets</h1>
        <Link
          href="/pets/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Add pet
        </Link>
      </div>

      {pets.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          No pets yet. Add your first pet to get started.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-md border border-border">
          {pets.map((pet) => (
            <li key={pet.id}>
              <Link
                href={`/pets/${pet.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-accent"
              >
                <span className="font-medium">{pet.name}</span>
                <span className="text-sm text-muted-foreground">
                  {pet.species} · {pet.age_stage}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
