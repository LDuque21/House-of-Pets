import { pool } from "@/lib/db";

// Must match the pets.species CHECK constraint in schema.sql.
// Grouped by kind of animal (see SPECIES_GROUPS in lib/format.ts).
export const SPECIES = [
  "dog", "cat", "horse", "pig", "rabbit", "ferret", "raccoon", "squirrel",
  "sugar_glider", "hedgehog", "guinea_pig", "chinchilla", "hamster", "rat", "mouse",
  "bird", "chicken",
  "lizard", "chameleon", "snake",
  "frog", "axolotl",
  "fish", "crab",
] as const;
export type Species = (typeof SPECIES)[number];
export const AGE_STAGES = ["baby", "adult", "senior"] as const;
export type AgeStage = (typeof AGE_STAGES)[number];
export type Confidence = "high" | "medium" | "low";

export type Pet = {
  id: string;
  user_id: string;
  name: string;
  species: Species;
  breed: string | null;
  age_stage: AgeStage;
  confidence: Confidence | null;
  // A resized image stored inline as a data: URL (no separate file storage).
  photo_url: string | null;
  notes: string | null;
  location_label: string | null;
  latitude: number | null;
  longitude: number | null;
  // Exact age if the owner knows it; age_stage is always set.
  age_years: number | null;
  // Known health conditions as the owner typed them, comma-separated.
  conditions: string | null;
  created_at: string;
};

export type PetInput = {
  name: string;
  species: Species;
  breed: string | null;
  age_stage: AgeStage;
  notes: string | null;
  photo_url: string | null;
  confidence: Confidence | null;
  location_label: string | null;
  latitude: number | null;
  longitude: number | null;
  age_years: number | null;
  conditions: string | null;
};

export async function createPet(userId: string, pet: PetInput): Promise<Pet> {
  const { rows } = await pool.query<Pet>(
    `INSERT INTO pets (user_id, name, species, breed, age_stage, notes, photo_url, confidence,
                       location_label, latitude, longitude, age_years, conditions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      userId, pet.name, pet.species, pet.breed, pet.age_stage, pet.notes, pet.photo_url, pet.confidence,
      pet.location_label, pet.latitude, pet.longitude, pet.age_years, pet.conditions,
    ]
  );
  return rows[0];
}

export async function updatePetForUser(petId: string, userId: string, pet: PetInput): Promise<Pet | null> {
  const { rows } = await pool.query<Pet>(
    `UPDATE pets SET name = $3, species = $4, breed = $5, age_stage = $6, notes = $7, photo_url = $8,
                     confidence = $9, location_label = $10, latitude = $11, longitude = $12,
                     age_years = $13, conditions = $14
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [
      petId, userId, pet.name, pet.species, pet.breed, pet.age_stage, pet.notes, pet.photo_url, pet.confidence,
      pet.location_label, pet.latitude, pet.longitude, pet.age_years, pet.conditions,
    ]
  );
  return rows[0] ?? null;
}

// Care reports and tasks go with it (ON DELETE CASCADE).
export async function deletePetForUser(petId: string, userId: string): Promise<boolean> {
  const { rowCount } = await pool.query(`DELETE FROM pets WHERE id = $1 AND user_id = $2`, [petId, userId]);
  return (rowCount ?? 0) > 0;
}

export async function listPetsForUser(userId: string): Promise<Pet[]> {
  const { rows } = await pool.query<Pet>(
    `SELECT * FROM pets WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function getPetForUser(petId: string, userId: string): Promise<Pet | null> {
  const { rows } = await pool.query<Pet>(
    `SELECT * FROM pets WHERE id = $1 AND user_id = $2`,
    [petId, userId]
  );
  return rows[0] ?? null;
}
