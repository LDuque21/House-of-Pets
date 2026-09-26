import { pool } from "@/lib/db";

export type Species = "dog" | "cat" | "rabbit";
export type AgeStage = "baby" | "adult" | "senior";

export type Pet = {
  id: string;
  user_id: string;
  name: string;
  species: Species;
  breed: string | null;
  age_stage: AgeStage;
  confidence: "high" | "medium" | "low" | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
};

export type NewPet = {
  name: string;
  species: Species;
  breed?: string | null;
  age_stage: AgeStage;
  notes?: string | null;
};

export async function createPet(userId: string, pet: NewPet): Promise<Pet> {
  const { rows } = await pool.query<Pet>(
    `INSERT INTO pets (user_id, name, species, breed, age_stage, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, pet.name, pet.species, pet.breed ?? null, pet.age_stage, pet.notes ?? null]
  );
  return rows[0];
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
