-- House of Pets schema (PostgreSQL / Neon)
-- Run: npm run db:push
--
-- User identity comes from Neon Managed Auth, which owns its own tables in the
-- `neon_auth` schema (see neon-auth skill docs) -- we don't create a `users`
-- table here. `pets.user_id` stores that auth user's id as plain TEXT (Better
-- Auth ids are not UUIDs) with no hard FK into `neon_auth`, since that schema
-- is managed by Neon's own tooling, not ours.
--
-- Destructive by design while the schema is still being designed (no real
-- pet data exists yet). Once the demo has real data in it, switch to
-- additive ALTER statements instead of dropping tables.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS care_reports CASCADE;
DROP TABLE IF EXISTS pets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Neon Managed Auth user id (neon_auth.user.id)
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'rabbit')),
  breed TEXT,
  age_stage TEXT NOT NULL CHECK (age_stage IN ('baby', 'adult', 'senior')),
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pets_user_id_idx ON pets(user_id);

CREATE TABLE care_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('diet', 'hygiene', 'health', 'insurance', 'behavior')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  content JSONB NOT NULL,
  model TEXT NOT NULL
);

CREATE INDEX care_reports_pet_id_idx ON care_reports(pet_id);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('diet', 'hygiene', 'health', 'insurance', 'behavior')),
  task_name TEXT NOT NULL,
  frequency_days INTEGER NOT NULL,
  next_due DATE NOT NULL
);

CREATE INDEX tasks_pet_id_idx ON tasks(pet_id);
CREATE INDEX tasks_next_due_idx ON tasks(next_due);
