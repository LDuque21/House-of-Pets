import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { auth } from "@/lib/auth/server";
import { listPetsForUser } from "@/lib/pets";
import { AnimalSilhouette, PetAvatar } from "@/components/animal-silhouettes";
import { buttonVariants } from "@/components/ui/button";
import { petSummary } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function PetsPage() {
  const { data: session } = await auth.getSession();
  const user = session!.user;
  const pets = await listPetsForUser(user.id);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">Your family</p>
          <h1 className="mt-1 text-3xl font-semibold">Your pets</h1>
        </div>
        {pets.length > 0 && (
          <Link href="/pets/new" className={buttonVariants({ size: "pill" })}>
            <Plus />
            Add a pet
          </Link>
        )}
      </div>

      {pets.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-3xl border-2 border-dashed border-border bg-card/60 px-6 py-14 text-center">
          <div aria-hidden className="flex items-end gap-1.5">
            <AnimalSilhouette species="dog" className="size-16 text-dog" />
            <AnimalSilhouette species="cat" className="size-14 text-cat" />
            <AnimalSilhouette species="rabbit" className="size-14 text-rabbit" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">No pets yet</h2>
          <p className="mt-1 max-w-sm text-muted-foreground">
            Add your first pet and we&apos;ll put together a care plan made just for them.
          </p>
          <Link href="/pets/new" className={cn(buttonVariants({ size: "pill" }), "mt-6")}>
            <Plus />
            Add your first pet
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => (
            <li key={pet.id}>
              <Link
                href={`/pets/${pet.id}`}
                className="group flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <PetAvatar species={pet.species} photoUrl={pet.photo_url} className="size-16" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-lg font-semibold">{pet.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{petSummary(pet)}</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
