"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { createPet, getPetForUser, type AgeStage, type Species } from "@/lib/pets";
import { buildCareHub, type CategoryResult } from "@/lib/agents/orchestrator";

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

export type GenerateCarePlanState = { results: CategoryResult[] } | null;

export async function generateCarePlanAction(
  _prevState: GenerateCarePlanState,
  formData: FormData
): Promise<GenerateCarePlanState> {
  const { data: session } = await auth.getSession();
  const user = session?.user;
  if (!user) {
    redirect("/auth/sign-in");
  }

  const petId = String(formData.get("pet_id") ?? "");
  const pet = await getPetForUser(petId, user.id);
  if (!pet) {
    throw new Error("Pet not found");
  }

  const results = await buildCareHub(pet);
  revalidatePath(`/pets/${petId}`);
  return { results };
}
