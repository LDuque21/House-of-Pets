"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import {
  AGE_STAGES,
  createPet,
  deletePetForUser,
  getPetForUser,
  SPECIES,
  updatePetForUser,
  type AgeStage,
  type Confidence,
  type PetInput,
  type Species,
} from "@/lib/pets";
import { buildCareHub, refineCategory, type CategoryResult } from "@/lib/agents/orchestrator";
import type { Category } from "@/lib/agents/schemas";
import { identifyPet, type Identification } from "@/lib/agents/vision";
import { completeTaskForUser, listCareReportsForPet, setTaskLastDoneForUser } from "@/lib/care-reports";

const CONFIDENCES: Confidence[] = ["high", "medium", "low"];
// Photos are resized in the browser to ~640px JPEG (well under this).
const MAX_PHOTO_CHARS = 900_000;
const PHOTO_DATA_URL = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

async function requireUser() {
  const { data: session } = await auth.getSession();
  const user = session?.user;
  if (!user) redirect("/auth/sign-in");
  return user;
}

function optionalText(formData: FormData, key: string): string | null {
  return String(formData.get(key) ?? "").trim() || null;
}

function optionalNumber(formData: FormData, key: string, limit: number): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
}

function parsePetForm(formData: FormData): PetInput {
  const name = String(formData.get("name") ?? "").trim();
  const species = String(formData.get("species") ?? "");
  const ageStage = String(formData.get("age_stage") ?? "");
  const confidence = String(formData.get("confidence") ?? "");
  const photo = String(formData.get("photo") ?? "");

  if (!name || !SPECIES.includes(species as Species) || !AGE_STAGES.includes(ageStage as AgeStage)) {
    throw new Error("Missing or invalid required fields");
  }
  if (photo && (photo.length > MAX_PHOTO_CHARS || !PHOTO_DATA_URL.test(photo))) {
    throw new Error("Invalid photo");
  }

  const latitude = optionalNumber(formData, "latitude", 90);
  const longitude = optionalNumber(formData, "longitude", 180);
  const hasCoordinates = latitude !== null && longitude !== null;
  const ageYears = optionalNumber(formData, "age_years", 100);
  return {
    name,
    species: species as Species,
    breed: optionalText(formData, "breed"),
    age_stage: ageStage as AgeStage,
    notes: optionalText(formData, "notes"),
    photo_url: photo || null,
    confidence: CONFIDENCES.includes(confidence as Confidence) ? (confidence as Confidence) : null,
    location_label: optionalText(formData, "location_label"),
    latitude: hasCoordinates ? latitude : null,
    longitude: hasCoordinates ? longitude : null,
    age_years: ageYears !== null && ageYears >= 0 ? Math.round(ageYears) : null,
    conditions: optionalText(formData, "conditions")?.slice(0, 300) ?? null,
  };
}

// Vision agent: suggests species/breed/age from a photo for the user to confirm.
export async function identifyPetAction(photoDataUrl: string): Promise<Identification> {
  await requireUser();
  if (photoDataUrl.length > MAX_PHOTO_CHARS) return { ok: false, error: "That photo is too large." };
  try {
    return await identifyPet(photoDataUrl);
  } catch (err) {
    console.error("[agent:vision] failed:", err);
    return { ok: false, error: "We couldn't analyze the photo right now. You can fill in the details yourself." };
  }
}

export async function createPetAction(formData: FormData) {
  const user = await requireUser();
  const pet = await createPet(user.id, parsePetForm(formData));
  revalidatePath("/pets");
  redirect(`/pets/${pet.id}`);
}

export async function updatePetAction(formData: FormData) {
  const user = await requireUser();
  const petId = String(formData.get("pet_id") ?? "");
  const pet = await updatePetForUser(petId, user.id, parsePetForm(formData));
  if (!pet) throw new Error("Pet not found");
  revalidatePath("/pets");
  revalidatePath(`/pets/${petId}`);
  redirect(`/pets/${petId}`);
}

export async function deletePetAction(formData: FormData) {
  const user = await requireUser();
  await deletePetForUser(String(formData.get("pet_id") ?? ""), user.id);
  revalidatePath("/pets");
  redirect("/pets");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function completeTaskAction(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("task_id") ?? "");
  if (!UUID.test(taskId)) throw new Error("Invalid task");
  const petId = await completeTaskForUser(taskId, user.id);
  if (petId) revalidatePet(petId);
}

export async function setTaskLastDoneAction(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("task_id") ?? "");
  const date = String(formData.get("last_done_on") ?? "");
  if (!UUID.test(taskId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid task or date");
  const petId = await setTaskLastDoneForUser(taskId, user.id, date);
  if (petId) revalidatePet(petId);
}

// The dashboard shows a routine summary, so both pages change with a task.
function revalidatePet(petId: string) {
  revalidatePath(`/pets/${petId}`);
  revalidatePath(`/pets/${petId}/routine`);
}

const CATEGORIES: Category[] = ["diet", "hygiene", "health", "insurance", "materials"];

export type RefineResult = { ok: true } | { ok: false; error: string };

// The per-card "Adjust" box: redo one category with the owner's request.
export async function refineCareReportAction(formData: FormData): Promise<RefineResult> {
  const user = await requireUser();
  const petId = String(formData.get("pet_id") ?? "");
  const category = String(formData.get("category") ?? "") as Category;
  const request = String(formData.get("request") ?? "").trim().slice(0, 300);
  if (!CATEGORIES.includes(category)) return { ok: false, error: "Unknown section." };
  if (request.length < 3) return { ok: false, error: "Tell us what you'd like changed." };

  const pet = UUID.test(petId) ? await getPetForUser(petId, user.id) : null;
  if (!pet) return { ok: false, error: "Pet not found." };
  const previous = (await listCareReportsForPet(pet.id)).find((r) => r.category === category);

  const result = await refineCategory(pet, category, { request, previous: previous?.content ?? {} });
  revalidatePet(pet.id);
  return result.status === "ok" ? { ok: true } : { ok: false, error: result.error };
}

export type GenerateCarePlanState = { results: CategoryResult[] } | null;

export async function generateCarePlanAction(
  _prevState: GenerateCarePlanState,
  formData: FormData
): Promise<GenerateCarePlanState> {
  const user = await requireUser();

  const petId = String(formData.get("pet_id") ?? "");
  const pet = await getPetForUser(petId, user.id);
  if (!pet) {
    throw new Error("Pet not found");
  }

  const results = await buildCareHub(pet);
  revalidatePet(petId);
  return { results };
}
