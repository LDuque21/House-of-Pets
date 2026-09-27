import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth/server";
import { getPetForUser } from "@/lib/pets";
import { DeletePetForm, PetForm } from "@/components/pet-form";

export default async function EditPetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: session } = await auth.getSession();
  const pet = await getPetForUser(id, session!.user.id);
  if (!pet) notFound();

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href={`/pets/${pet.id}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {pet.name}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">Edit {pet.name}</h1>
      <div className="mt-8">
        <PetForm pet={pet} />
      </div>
      <section className="mt-8 flex flex-col gap-3 rounded-3xl border border-destructive/30 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Remove this pet</h2>
          <p className="text-sm text-muted-foreground">Deletes {pet.name}&apos;s profile, care plan and tasks.</p>
        </div>
        <DeletePetForm petId={pet.id} petName={pet.name} />
      </section>
    </div>
  );
}
