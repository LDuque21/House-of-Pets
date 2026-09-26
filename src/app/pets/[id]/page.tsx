import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getPetForUser } from "@/lib/pets";

export default async function PetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: session } = await auth.getSession();
  const user = session!.user;

  const pet = await getPetForUser(id, user.id);
  if (!pet) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 p-8">
      <h1 className="text-xl font-semibold">{pet.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {pet.species}
        {pet.breed ? ` · ${pet.breed}` : ""} · {pet.age_stage}
      </p>
      {pet.notes && <p className="mt-4 text-sm">{pet.notes}</p>}
    </div>
  );
}
