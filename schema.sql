-- House of Pets schema (PostgreSQL / Neon)
-- Run once against a fresh database: psql "$DATABASE_URL" -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  auth_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'rabbit')),
  breed TEXT,
  age_stage TEXT NOT NULL CHECK (age_stage IN ('baby', 'adult', 'senior')),
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pets_user_id_idx ON pets(user_id);

CREATE TABLE IF NOT EXISTS care_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('diet', 'hygiene', 'health', 'insurance')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  content JSONB NOT NULL,
  model TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS care_reports_pet_id_idx ON care_reports(pet_id);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('diet', 'hygiene', 'health', 'insurance')),
  task_name TEXT NOT NULL,
  frequency_days INTEGER NOT NULL,
  next_due DATE NOT NULL
);

CREATE INDEX IF NOT EXISTS tasks_pet_id_idx ON tasks(pet_id);
CREATE INDEX IF NOT EXISTS tasks_next_due_idx ON tasks(next_due);
