# Pet Care Hub

Personalized pet care plans (diet, hygiene, health, insurance), generated per-pet from a photo or description, plus a derived task calendar. Built for ShellHacks 2026.

## Stack

- Next.js (App Router, TypeScript) + Tailwind
- PostgreSQL (hosted on [Neon](https://neon.tech), free tier)
- Google Gemini API (vision + structured-output text generation)
- Deployed on DigitalOcean App Platform

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` (from your Neon project) and `GEMINI_API_KEY` (from [Google AI Studio](https://aistudio.google.com/apikey)).
3. Apply the schema once: `psql "$env:DATABASE_URL" -f schema.sql` (or run the contents of `schema.sql` in Neon's SQL editor).
4. `npm run dev` — runs at http://localhost:3000

## Status

Early scaffold — see project history / commits for progress against the build order in the spec.
