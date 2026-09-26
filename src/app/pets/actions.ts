"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { createPet, type AgeStage, type Species } from "@/lib/pets";

const SPECIES: Species[] = ["dog", "cat", "rabbit"];
const AGE_STAGES: AgeStage[] = ["baby", "adult", "senior"];

export async function createPetAction(formData: FormData) {
  const { data: session } = await auth.getSession();
  const user = session?.user;
  if (!user) {
    redirect("/auth/sign-in");
  }

  const name = String(formData.get("name") ?? "").trim();
  const species = String(formData.get("species") ?? "");
  const breed = String(formData.get("breed") ?? "").trim();
  const ageStage = String(formData.get("age_stage") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || !SPECIES.includes(species as Species) || !AGE_STAGES.includes(ageStage as AgeStage)) {
    throw new Error("Missing or invalid required fields");
  }

  const pet = await createPet(user.id, {
    name,
    species: species as Species,
    breed: breed || null,
    age_stage: ageStage as AgeStage,
    notes: notes || null,
  });

  redirect(`/pets/${pet.id}`);
}
