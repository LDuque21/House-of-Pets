# House of Pets — Project Spec

_(Originally drafted under the working title "Pet Care Hub"; renamed after the GitHub repo was created. Content below is otherwise unchanged.)_

**Event:** ShellHacks 2026 (deadline Sep 27, 11:00am EDT)
**Target challenges:** Gemini API (primary), Microsoft (secondary — core experience must NOT be a chatbot), stackable: DigitalOcean, GoDaddy Registry
**Developer:** solo

## 1. Problem & pitch

New pet owners don't know what their pet actually needs — diet, hygiene routines, health/vet cadence, insurance — and that information is scattered across breed-specific forums and vet sites. This app is a single hub: the user adds a pet (photo or description), and the app generates a structured, personalized care plan across categories, plus a recurring task calendar (litter changes, teeth brushing, vet checkups).

**Non-negotiable constraint (Microsoft challenge):** the core experience is a dashboard the user acts on, not a chat window. Any AI "conversation" (the refine feature below) is a secondary control on the dashboard, not the primary interface.

## 2. Scope for this build

**In scope (species):** dog, cat, rabbit.
**Out of scope for the hackathon demo (mention as "extensible to"):** snake, turtle, and any species not in `SPECIES_CONFIG`.

**Care categories (sub-agents):** Diet, Hygiene, Health, Insurance. (Do not add more categories — four is the target for the demo.)

**Core user flow:**
1. User adds a pet — uploads a photo OR types a description.
2. App identifies species/breed (photo → Gemini vision call; text → Gemini text call), shows result for user confirmation/edit.
3. On confirm, orchestrator fires 4 parallel Gemini calls (one per category), each returning fixed-schema JSON.
4. Dashboard renders one card per category as each resolves.
5. Derived recurring tasks populate a simple calendar/checklist view.
6. Optional: user types a short refine command under a card ("simplify this", "more detail on grooming") → one more Gemini call rewrites just that section.

## 3. Architecture

```
User → Frontend (Next.js)
     → Vision/Species agent (Gemini multimodal) → Pet profile (Postgres)
     → Orchestrator (plain async code, NOT an LLM call)
         → Diet agent (Gemini + JSON schema)
         → Hygiene agent (Gemini + JSON schema)
         → Health agent (Gemini + JSON schema)
         → Insurance agent (Gemini + JSON schema)
     → Aggregator (merges 4 JSON reports into one document)
     → Dashboard (cards) + derived task calendar
     → Refine agent (Gemini, on-demand, scoped to one section)
```

The "multi-agent system" is implemented as **one Gemini call per agent with a dedicated system prompt and a fixed response schema** — not separate services or message passing. The orchestrator is ordinary code that runs these calls in parallel (`Promise.all`) and merges results. This is intentional: it delivers the same user-facing behavior as a "real" multi-agent system with far less infrastructure and far fewer failure points, which matters given the timeline.

## 4. Tech stack

- **Frontend + backend:** Next.js (App Router), single deployable app — no separate frontend/backend repos.
- **Styling:** Tailwind.
- **LLM:** Google Gemini API, multimodal input for the vision agent, `responseSchema` / structured output mode for every sub-agent call.
- **Database:** PostgreSQL, hosted on Neon (free tier).
- **Deployment:** DigitalOcean App Platform (stackable MLH prize).
- **Domain:** register one domain via GoDaddy Registry (stackable MLH prize, ~10 min task, do this last).

## 5. Data model (PostgreSQL tables)

```sql
-- users
(id, name, auth_id, created_at)

-- pets
(id, user_id, name,
 species,                  -- 'dog' | 'cat' | 'rabbit'
 breed,                    -- nullable
 age_stage,                -- 'baby' | 'adult' | 'senior'
 confidence,               -- 'high' | 'medium' | 'low', from vision agent
 photo_url,                -- nullable
 created_at)

-- care_reports
(id, pet_id,
 category,                 -- 'diet' | 'hygiene' | 'health' | 'insurance'
 generated_at,
 content,                  -- JSONB, category-specific schema, see section 6
 model)

-- tasks (derived from care_reports.content, not user-entered)
(id, pet_id, category, task_name, frequency_days, next_due)
```

See `schema.sql` for the exact DDL. `SPECIES_CONFIG` (which prompt hints/context apply per species) lives as a **static object in code**, not a database table — this is intentionally not admin-editable for the hackathon; speed over flexibility.

## 6. Sub-agent contracts

Every sub-agent call must pass a `responseSchema` to Gemini so output is parseable JSON, never free text to regex out.

**Diet agent:**
```json
{
  "category": "diet",
  "summary": "string",
  "recommendations": [
    { "item": "string", "brand_examples": ["string"], "notes": "string" }
  ],
  "frequency": { "value": 0, "unit": "times_per_day" },
  "cautions": ["string"]
}
```

**Hygiene agent:**
```json
{
  "category": "hygiene",
  "summary": "string",
  "routines": [
    { "task": "string", "frequency_days": 0, "notes": "string" }
  ],
  "supplies": ["string"]
}
```

**Health agent:**
```json
{
  "category": "health",
  "summary": "string",
  "vet_checkup_frequency_days": 0,
  "vaccinations": ["string"],
  "warning_signs": ["string"]
}
```

**Insurance agent:**
```json
{
  "category": "insurance",
  "summary": "string",
  "coverage_types": ["string"],
  "estimated_monthly_cost_range": { "low": 0, "high": 0, "currency": "USD" },
  "notes": "string"
}
```

Each agent's system prompt should incorporate `species`, `breed` (if known), and `age_stage` from the pet profile so recommendations are personalized, not generic.

**Vision agent** (separate contract, runs before the above):
```json
{ "species": "string", "breed": "string|null", "confidence": "high|medium|low", "reasoning": "string" }
```
Always surface this to the user for confirmation/edit before saving to `pets`. Text-description path (no photo) uses the same output contract via a text-only Gemini call, and writes to the same `pets.species/breed` fields — one code path, two input types.

**Refine agent** (on-demand, per-section): takes the existing `care_reports.content` for one category plus a short user instruction, returns an updated `content` object in the same schema as that category. This is the only place free-text user input reaches an LLM after generation — keep it scoped to one card, never a general chat surface.

## 7. Orchestrator (pseudocode)

```js
async function buildCareHub(pet) {
  const [diet, hygiene, health, insurance] = await Promise.all([
    callSubAgent('diet', pet),
    callSubAgent('hygiene', pet),
    callSubAgent('health', pet),
    callSubAgent('insurance', pet),
  ]);
  const reports = { diet, hygiene, health, insurance };
  await saveReports(pet.id, reports);
  await deriveTasks(pet.id, reports); // pulls frequency/routine fields into `tasks`
  return reports;
}
```

Render cards independently as each promise resolves if time allows (skeleton loaders); a single loading state blocking on `Promise.all` is an acceptable fallback if time is short.

## 8. UI requirements

1. **Add pet screen** — photo upload OR text description field (either/or, not both required). Submit triggers species ID.
2. **Confirm screen** — shows detected species/breed/confidence; user can edit before saving.
3. **Generating state** — 4 card skeletons, fill in as each sub-agent resolves.
4. **Dashboard** — one card per category (Diet, Hygiene, Health, Insurance) plus a task calendar/checklist view built from `tasks`.
5. **Refine control** — small text input under an individual card, not a persistent chat panel anywhere in the app.

## 9. Build order (do not reorder — later steps depend on earlier ones working)

1. Repo scaffold (Next.js), Gemini API key, Postgres (Neon) connected.
2. One full vertical slice: photo upload → vision agent → pet profile saved → Diet agent → rendered card. Prove this end-to-end before anything else.
3. Clone the pattern for Hygiene, Health, Insurance.
4. Task derivation + calendar/checklist view.
5. Frontend polish: onboarding flow, dashboard layout.
6. Refine control (only if time remains — this is the first thing to cut).
7. Deploy to DigitalOcean, register domain via GoDaddy, record demo video, write Devpost submission.

## 10. Explicit cuts (do not build these for the demo)

- No species beyond dog/cat/rabbit.
- No categories beyond Diet/Hygiene/Health/Insurance.
- No user auth system beyond the minimum needed to associate pets with a user (a single hardcoded/demo user is acceptable).
- No admin UI for `SPECIES_CONFIG` — it's a code file, edited directly.
- No persistent chat interface anywhere — this is a hard constraint from the Microsoft challenge requirements, not just a scope cut.

## Amendments from the original spec

- **Database switched from MongoDB Atlas to PostgreSQL (Neon).** The data model here is relational (users → pets → care_reports/tasks via foreign keys), and the one semi-structured field (`care_reports.content`) is well served by Postgres `JSONB`. MongoDB Atlas was named in the original spec mainly as an MLH stackable-prize track, not for a technical fit reason; Neon's free tier (no card, scales to zero, no manual unpause) fit the hackathon's time constraints better than DigitalOcean Managed Postgres (no free tier) or Supabase (pauses the whole project after 7 days idle).
- Still open / to be resolved before further build: photo storage service, multi-pet UI (list/switcher), partial sub-agent failure handling, exact current Gemini model id. See conversation history / issues for tracking.
