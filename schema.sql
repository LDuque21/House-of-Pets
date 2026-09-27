-- House of Pets schema (PostgreSQL / Neon)
--
-- This file reflects the CURRENT target schema, kept in sync with the live
-- database, but running it again is a no-op via IF NOT EXISTS -- it will NOT
-- pick up column/constraint changes on tables that already exist. Real user
-- data exists in this database now (as of the materials/behavior rename);
-- schema changes from here on are applied as one-off ALTER migration
-- scripts, run once by hand, not by re-running this file.
--
-- User identity comes from Neon Managed Auth, which owns its own tables in the
-- `neon_auth` schema (see neon-auth skill docs) -- we don't create a `users`
-- table here. `pets.user_id` stores that auth user's id as plain TEXT (Better
-- Auth ids are not UUIDs) with no hard FK into `neon_auth`, since that schema
-- is managed by Neon's own tooling, not ours.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Neon Managed Auth user id (neon_auth.user.id)
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'rabbit', 'fish', 'bird', 'horse', 'reptile', 'hamster')),
  breed TEXT,
  age_stage TEXT NOT NULL CHECK (age_stage IN ('baby', 'adult', 'senior')),
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Where the pet lives: a typed place and/or browser GPS coordinates.
  location_label TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  -- Optional exact age, and known health conditions (free text, comma-separated).
  age_years INTEGER CHECK (age_years BETWEEN 0 AND 100),
  conditions TEXT
);

CREATE INDEX IF NOT EXISTS pets_user_id_idx ON pets(user_id);

CREATE TABLE IF NOT EXISTS care_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('diet', 'hygiene', 'health', 'insurance', 'materials')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  content JSONB NOT NULL,
  model TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS care_reports_pet_id_idx ON care_reports(pet_id);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('diet', 'hygiene', 'health', 'insurance', 'materials')),
  task_name TEXT NOT NULL,
  frequency_days INTEGER NOT NULL,
  next_due DATE NOT NULL,
  last_done_on DATE -- set when the owner marks the task done
);

-- Regenerating a plan updates tasks in place, so completion history survives.
CREATE UNIQUE INDEX IF NOT EXISTS tasks_pet_category_name_key ON tasks(pet_id, category, task_name);

CREATE INDEX IF NOT EXISTS tasks_pet_id_idx ON tasks(pet_id);
CREATE INDEX IF NOT EXISTS tasks_next_due_idx ON tasks(next_due);
