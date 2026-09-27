# House of Pets

**Live:** https://project-gibby.com

A pet-care dashboard. Snap a photo of your pet, and a Gemini vision agent identifies the species, breed and age for you to confirm. Then five specialist AI agents build a care plan in parallel — **Diet, Hygiene, Health, Insurance and Materials** — each shown as its own card, plus a recurring **Care routine** (feeding, baths, dental care, cleanup, vet checkups) with how often to do each.

Built solo for ShellHacks 2026.

## Features

- **Eight species:** dog, cat, rabbit, fish, bird, horse, reptile, hamster.
- **Add a pet by photo or by hand.** The vision agent pre-fills the form; you confirm or correct it.
- **Five-category care plan**, kept short enough to scan in seconds: one recommended food with brands and prices, bathing/dental/cleanup routines, checkup frequency and warning signs, matching insurers, and a shopping list.
- **Grounded insurance picks.** The insurance agent can only choose from a vetted list of real insurers (Trupanion, Healthy Paws, Embrace, Figo, ASPCA, Nationwide), filtered to those that actually cover the species. Fish get an honest "no insurers cover this" instead of a made-up answer.
- **Must-have supplies** for each species are always listed, with "Find nearby" links based on the pet's home location (typed in, or taken from your phone's GPS).
- **Pet profiles** with photos, editing and removal; account profile photo.
- **Light and dark themes**, WCAG AA contrast throughout.
- **Installable on phones** as a web app (Add to Home Screen) — no app store needed.

## How the agents work

```
photo ──► Vision agent ──► species / breed / age (user confirms)
                                   │
                                   ▼
                            Orchestrator (plain code, Promise.all)
        ┌──────────┬──────────┬────┴─────┬───────────┬───────────┐
        ▼          ▼          ▼          ▼           ▼
      Diet     Hygiene     Health    Insurance   Materials
        │          │          │          │           │
        └──── each: own prompt + enforced JSON schema, saved independently
                                   │
                                   ▼
                    Care routine tasks derived from the results
```

- Every agent is a single Gemini call with **structured output** (`responseJsonSchema`), so each card renders from typed data, not free text.
- Agents run **in parallel** and save independently: if one fails, the other four still land and the card says what went wrong. Responses missing required fields are rejected, so a bad answer never overwrites a good plan.
- Prompts are specialized **per species** (a fish gets water-quality care instead of baths, a horse gets stall mucking and farrier visits).
- The orchestrator is deliberately plain code, not an LLM router — it's predictable, fast, and cheap (about half a cent per full plan).
- It's a **dashboard, not a chatbot**: the answer is structured cards and a routine, not a conversation.

## Stack

- **Next.js 16** (App Router, TypeScript), **Tailwind v4**, **shadcn/ui**
- **PostgreSQL on [Neon](https://neon.tech)**; care reports stored as JSONB
- **Neon Auth** (email + password)
- **Google Gemini** (`gemini-flash-latest`) via `@google/genai` for vision and structured generation
- **DigitalOcean App Platform** hosting, auto-deployed from `main`; domain from **GoDaddy**

## Local setup

Requires Node 24.

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL` — a Neon pooled connection string
   - `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` — from your Neon project's Auth settings
   - `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/apikey)
3. Create the tables once: `node --env-file=.env.local scripts/apply-schema.mjs` (or paste `schema.sql` into Neon's SQL editor).
4. `npm run dev`, then open http://localhost:3000

## Project layout

```
src/app/pets/          pet list, add, dashboard, edit + server actions
src/lib/agents/        orchestrator, vision agent, JSON schemas, per-species config,
                       insurer list, must-have supplies
src/lib/               database access, Gemini client, formatting helpers
src/components/        pet form, care-plan cards, species silhouettes
schema.sql             database schema
```
