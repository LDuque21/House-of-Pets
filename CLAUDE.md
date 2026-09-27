# House of Pets — project context

ShellHacks 2026 hackathon project. Deadline: **Sep 27, 11:00am EDT** (check the current time against this — it is close). Solo developer (Luis Duque, GitHub `LDuque21`). Repo: https://github.com/LDuque21/House-of-Pets (public).

**Live:** https://project-gibby.com (also https://house-of-pets-qmu5o.ondigitalocean.app). Auto-deploys from `main`.

Original spec: [docs/spec.md](docs/spec.md) (has an "Amendments" section on the Postgres/Mongo pivot). This file is the condensed, current state — read it first. Much has changed since the spec (species, vision agent, photos, location); where they disagree, this file wins.

## What this is

A pet-care dashboard. A user signs up, adds a pet — by uploading a photo (a Gemini vision agent fills in species/breed/age to confirm) or by typing the details — then generates an AI care plan across five categories (Diet, Hygiene, Health, Insurance, Materials), each shown as a card (side by side on wide screens, each with an "Adjust" box that re-runs just that agent on the owner's request), plus a "Care routine" screen of recurring tasks with due dates and a calendar. Twelve species: dog, cat, rabbit, fish, bird, horse, reptile, hamster, guinea_pig, rat, chinchilla, raccoon. Pets can have photos, a home location (for "find nearby" store links), and can be edited or removed. Users can set a profile photo. The site is installable on phones as a web app (PWA).

## Stack

- **Next.js 16** (App Router, TypeScript, `src/`), **Tailwind v4**, **shadcn/ui** (`base-nova`) — chosen because Neon Auth's UI uses the same CSS-variable token system.
- **Postgres on Neon** (project `restless-boat-46160363`, default branch `production` = `br-damp-bread-b5fzf53l`, region aws-us-east-2). Relational data; `care_reports.content` is JSONB. MongoDB (original spec) was dropped — it was only there for a prize track.
- **Neon Managed Auth** (Better Auth under the hood; UI from `@neondatabase/auth-ui`, which re-exports Better Auth UI and next-themes' `useTheme`). **Email + password only** — magic link and OAuth were rejected for live-demo reliability. No `users` table of ours; `pets.user_id` is Neon Auth's user id as plain `TEXT`.
- **Google Gemini** via `@google/genai`, model `gemini-flash-latest` (currently resolves to `gemini-3.8-flash`). Structured output with `responseJsonSchema` + `responseMimeType: "application/json"`.
- **Hosting:** DigitalOcean App Platform, $5 plan (512 MB, 1 container). Domain `project-gibby.com` bought on GoDaddy, nameservers pointed at DigitalOcean (ns1–3.digitalocean.com), DNS managed in DigitalOcean.

## Architecture map

```
src/app/
  page.tsx                     landing: hero (dog/cat/rabbit art), "Made for every kind of pet" row, 5 categories, how-it-works
  layout.tsx                   fonts, header/footer, PWA metadata (appleWebApp) + theme-color viewport
  manifest.ts                  web app manifest (standalone, start_url /pets); icons in public/icons/, apple-icon.png
  icon.svg, apple-icon.png     favicon + iPhone home-screen icon
  providers.tsx                NeonAuthUIProvider (avatar upload on, account basePath /account, wrapper div is flex-1)
  auth/[path]/page.tsx         sign-in / sign-up / forgot-password (Better Auth UI AuthView)
  account/[path]/page.tsx      /account/settings (name, profile photo), /account/security; /account redirects there
  api/auth/[...path]/route.ts  Neon Auth handler
  pets/page.tsx                the user's pets (cards with photo or silhouette avatar)
  pets/new/page.tsx            add a pet (PetForm)
  pets/[id]/page.tsx           pet dashboard: header card (photo, summary, conditions, location, Edit), generate button, routine banner, 5 plan cards (xl: one row)
  pets/[id]/routine/page.tsx   care routine screen: RoutineList (left) + RoutineCalendar (right)
  pets/[id]/edit/page.tsx      edit pet (PetForm) + remove pet
  pets/actions.ts              server actions: identifyPetAction, createPetAction, updatePetAction, deletePetAction, generateCarePlanAction

src/lib/
  db.ts                        pg Pool singleton (DATABASE_URL)
  pets.ts                      SPECIES / AGE_STAGES lists, Pet type, CRUD scoped to user_id
  care-reports.ts              save/list reports (newest per category), task derivation + upsert, list tasks (by due date), completeTaskForUser
  gemini.ts                    client per agent key + generateStructuredJson() (optional inline image, 429/503 retry)
  format.ts                    petSummary ("Dog · Beagle · Puppy"), frequencyLabel ("Weekly"), nearbySearchUrl (Google Maps)
  agents/
    orchestrator.ts            buildCareHub(pet): Promise.all over 5 category agents — plain code, NOT an LLM router
    vision.ts                  identifyPet(photo): species/breed/age/confidence; unsupported-species message
    schemas.ts                 JSON Schemas; insuranceSchema(species) built per pet; schemaFor()
    species-config.ts          per-species prompt context for all 12 species
    insurance-providers.ts     hardcoded real insurers + URLs + which species each covers
    essentials.ts              per-species must-have supplies + matchEssentials()

src/components/
  pet-form.tsx                 add/edit form: photo upload (browser-resized) -> vision prefill, species/age tiles, location (typed or GPS); DeletePetForm
  animal-silhouettes.tsx       AnimalSilhouette (mask over currentColor), PawPrint, PetAvatar (photo or silhouette), SPECIES_TINTS
  care-report-card.tsx         one card per category; diet/hygiene product picks with Amazon links; health screenings + condition care; materials merges must-haves + agent extras with "Find nearby" links
  care-routine.tsx             (client) task list with due labels + "Mark done", month calendar
  generate-care-plan-form.tsx  generate button, "5 specialists working" chips, plain-language failure messages
  site-header.tsx, theme-toggle.tsx, submit-button.tsx, category-meta.ts, ui/button.tsx (added `pill` and `xl` sizes)

public/silhouettes/<species>.png   the user's own silhouette artwork, cut into tight alpha masks (one per species)
src/proxy.ts                       Next 16 middleware; protects /account/* and /pets/*
schema.sql                         current schema (CREATE TABLE IF NOT EXISTS — documents the state; don't replay for changes)
.do/app.yaml                       DigitalOcean app spec (reference; the live app was configured in the dashboard)
```

## Agent system

- **Five category agents** (Diet, Hygiene, Health, Insurance, Materials): one Gemini call each, own system prompt + JSON schema, run in parallel. Each saves its own report; one failing doesn't block the others, and the UI says which failed and why (raw error under "Details"). Before saving, the orchestrator checks the response has the schema's required top-level keys — otherwise a malformed answer would replace the last good report with a blank card.
- **Output is deliberately concise** (user feedback: scannable in seconds). Diet: up to 3 food products (package, price, short why), one feeding sentence, ≤2 cautions. Hygiene: bathing / dental / cleanup (litter, cage, tank or stall), each routine carrying its own product needs (2-4 needs in total, up to 3 products each; no filler like trash bags), rendered nested under the routine. Health: checkup frequency, ≤3 vaccinations (none for species that aren't vaccinated), ≤4 warning signs, ≤3 age-based screenings due now ("like a colonoscopy at 45"), ≤2 upcoming milestones (non-seniors), and condition care per known condition.
- **Product links are Amazon only** (user's choice), built in code as Amazon *searches* for the product name (`amazonSearchUrl`) — the model can't know ASINs, so product-page links would be invented. Cards still render the pre-Sep-27 report shapes (`primary_food`, `supplies`) until a pet is regenerated.
- **Pet profile feeds every agent**: optional `age_years` and free-text `conditions` (comma-separated, shown as chips). Insurance notes must mention pre-existing-condition handling when conditions exist; the health card says "follow your vet's plan".
- **Insurance** picks only from `insurance-providers.ts` (Trupanion, Healthy Paws, Embrace, Figo, ASPCA, Nationwide); the enum is filtered to insurers covering the species. Dogs/cats: 3-5 of all six. Rabbit, bird, reptile, hamster: Nationwide only. Horse: ASPCA only. Fish: nobody — the insurance agent is skipped and the card says so.
- **Materials**: the species' must-haves from `essentials.ts` (e.g. cat: litter box, food, bowls, scratching post, toys, hiding spot, carrier, daily play) are passed to the agent to price, and the card always shows them ("Must-have") plus the agent's extras. Activities (daily play/walks) get no shopping link.
- **Vision agent** (`vision.ts`) runs before a pet exists, outside the orchestrator. Unsupported animal → exactly "This animal type is not currently supported by this application" (user-specified); no animal → its own message.
- **Tasks** are derived after each successful category: diet → Feed (daily); hygiene → Bath / Dental care / Cleanup; health → Vet checkup + each screening + "<Condition> vet follow-up". Frequencies are integers (`tasks.frequency_days` is INTEGER); 0 = "not routinely needed" (no task, "As needed" on cards).
- **Care routine is a live tracker** (user reversed the earlier "no due dates" call on Sep 27): due labels, overdue highlighting, "Mark done" (`completeTaskAction` → `last_done_on` = today, `next_due` = today + frequency), "When did you last do this?" backdating (`setTaskLastDoneAction`), and a month calendar (`care-routine.tsx`, client) on its own screen that projects non-daily tasks only (daily ones are listed, not drawn) and shows last completions struck through. Tasks are upserted on `(pet_id, category, task_name)` so regenerating keeps history; new tasks start due today. "Today" is America/New_York (`TODAY` in `care-reports.ts`).

## Database

Real data exists (the user's pets "Gibby" (cat) and "Biscuit" (rabbit, with stale old-format reports until regenerated)). **Schema changes are one-off `ALTER` scripts run once**, then mirrored into `schema.sql` — never drop-and-recreate. Changes applied so far: categories `behavior` → `materials`; `pets_species_check` widened to 8, then (Sep 27) 12 species; `pets.location_label`, `latitude`, `longitude` added; (Sep 27) `pets.age_years`, `pets.conditions`, `tasks.last_done_on`, unique index `tasks_pet_category_name_key`, `care_reports.request`.

Tables: `pets` (name, species, breed, age_stage, age_years, conditions, confidence, photo_url as a data: URL, notes, location fields), `care_reports` (category, JSONB content, model), `tasks` (derived: task_name, frequency_days, next_due, last_done_on).

## UI / design system

Warm, friendly look. Tokens in `globals.css`: light = cream + terracotta, dark = cocoa + apricot; every text pair checked to WCAG AA (4.5:1) — recheck if you change colors. Extra tokens: category tints (`diet`… each with `-soft`) and species tints for all 12 species (new ones contrast-checked Sep 27). Fonts: Nunito (body, `--font-sans`), Fredoka (headings, `--font-display` → `font-heading`, all h1–h3). Theme follows the OS until the header toggle is used (next-themes remembers it). Images (pet photos, profile photos) are stored inline as data: URLs — no object storage, so keep them small (pet photos are resized to ~640px JPEG in the browser). To add a species: mask PNG in `public/silhouettes/`, tint pair in `globals.css` + `SPECIES_TINTS`, and entries in every `Record<Species, …>` (TypeScript will list them), plus widen the DB CHECK, and add it to `HAS_ARTWORK` in `animal-silhouettes.tsx` (species without art render a paw print). Cut masks with `node scripts/cut-silhouettes.mjs <sheet> <species...>` (splits a side-by-side sheet left to right). Guinea pig and chinchilla still need art; raccoon and rat art was sent in chat and needs saving as a file.

## Deployment

- DigitalOcean App Platform app `house-of-pets`, GitHub `LDuque21/House-of-Pets`, branch `main`, deploy on push. Build `npm run build`, run `npm start`, port 8080. Env vars set **in the DO dashboard**: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` (run + build time), `GEMINI_API_KEY` (run time).
- **Neon Auth trusted domains** (sign-in fails with "invalid domain" for any other origin): `https://house-of-pets-qmu5o.ondigitalocean.app`, `https://project-gibby.com`, `https://www.project-gibby.com`. Localhost is pre-approved.
- `project-gibby.com` resolves and serves HTTPS (Google Trust Services cert). **`www.project-gibby.com` still needs adding** in the app's Networking → Domains.
- `cross-env` is a runtime `dependency` on purpose (DO prunes devDependencies; `npm start` uses it). Node pinned to `24.x` in `engines`.

## Gemini key and cost

- Paid plan is on; cost ≈ half a cent per full plan. `.env.local`'s `GEMINI_API_KEY` is a new `AQ.` key that **works as of Sep 26 10:53pm** (verified with a one-request test). Keys never need regenerating for billing (billing is per Google Cloud project).
- History: Google has an unresolved bug where `AQ.` keys can be rejected with 401 `ACCESS_TOKEN_TYPE_UNSUPPORTED`; the previous key hit it. If a 401 comes back, it's the key, not the code. The fallback discussed (not built) is Gemini via Vertex AI with a service account — note the SDK uses `GEMINI_API_KEY` from the environment even in Vertex mode unless `project` and `location` are passed explicitly.
- Optional per-agent keys: `GEMINI_API_KEY_DIET` … `_MATERIALS`, `_VISION` (fall back to `GEMINI_API_KEY`).

## Explicit scope decisions (don't relitigate without asking)

- **No persistent chatbot** — hard Microsoft-challenge requirement (the core is a dashboard). The per-card "Adjust" box is the only sanctioned free-text LLM surface (built Sep 27: `refine-report-form.tsx` → `refineCareReportAction` → `refineCategory`; one-shot, the previous card JSON goes in the system prompt, the request in the user message, saved to `care_reports.request` and shown on the card).
- **Orchestrator stays plain code**, not an LLM router.
- **Categories locked to the five.** Species are the twelve above (the user expanded from dog/cat/rabbit, then added rodents and raccoon as separate tiles). Raccoons: pet page shows a legality notice; no insurer covers them (Nationwide excludes permit-required species).
- **Email + password auth only.**
- **Microchips can't give GPS** (passive RFID) — don't pitch chip tracking; location is user-set per pet. Live tracking would be a future GPS-collar integration.
- **Mobile = installable web app (PWA)**, not app-store builds (cost/review time). No service worker/offline mode on purpose.
- **Custom ML model for species detection: deferred by the user** ("down the line"). If revisited: a pretrained ImageNet model (e.g. MobileNet) in the browser as an instant first guess, with Gemini still confirming breed/age — don't replace the Gemini vision agent (it's the Gemini-track showcase).

## Current status and next steps

**Done and live:** everything above — auth, 12 species, photo identification, pet photos/edit/remove, profile photo, location + find-nearby, must-haves, redesigned light/dark UI with the user's silhouettes, PWA, DigitalOcean deploy, custom domain.

**Not yet verified live:** a full care-plan generation and a photo identification in production with the new key (the user was about to test). Worth testing a fish (no insurers) and a horse (ASPCA only).

**Remaining before the deadline (priority order):**
1. Live test on the phone (install the PWA, add a pet by photo, generate a plan); fix anything that breaks.
2. Add `www.project-gibby.com` in DigitalOcean.
3. Devpost writeup — story: 5 specialist Gemini agents in parallel with enforced JSON schemas + a Gemini vision agent + grounded insurer list; dashboard not chatbot (Microsoft); DigitalOcean + GoDaddy prize tracks. A QR code for https://project-gibby.com was generated for the slides.
4. README refresh — it still says "early scaffold", four categories, dog/cat/rabbit.
5. Demo video; submit by ~10am for buffer.
6. Only if time remains: .ics calendar export, ML first-guess. (Checkable tasks and the per-card refine box: done Sep 27.)

## Working agreement

- **Ask before running live tests** that call Gemini (or driving the app in a browser). Typecheck and `npm run build` are always fine. The user tests in their own browser/phone.
- **The dev server hot-reloads each saved file**, so a test during a multi-file edit can run mixed old/new code (this once sent Gemini no schema). Tell the user before and after multi-file edits; order edits so each intermediate state runs.
- **Verify the disk, not the editor.** The user's VS Code had stale/unsynced buffers: a key "change" never reached `.env.local`, and turning on auto-save overwrote `orchestrator.ts` with an old copy (restored from git). Before assuming an edit landed, check file mtimes, `git status`/`git diff`, or a key fingerprint (SHA-256 prefix — never print the key). Auto-save is now on.
- Don't handle the user's secrets directly: never print keys; the user edits `.env.local` and DigitalOcean env vars themselves. (A key was once pasted into chat; it's no longer the one in use — make sure it's deleted in AI Studio.)
- Branch before committing on `main` is the default rule, but the user asked for work to land on `main` (it deploys). Ask before pushing if unsure.
- Once a dev server is running, leave it running (the user tests against it).

## Environment quirks (Windows; already solved — don't re-debug)

- `node`/`npm` aren't on the shell PATH Claude's tools get: prepend `C:\Program Files\nodejs`.
- Files under `AppData\Roaming` are EFS-encrypted; copying them fails with `UNKNOWN`/`EXDEV` (reads and fresh writes are fine). `NEXT_TELEMETRY_DISABLED=1` is set via `cross-env` for the same reason.
- Claude's scratchpad path exceeds Windows' 260-char limit: PowerShell `Get-Content`/`Get-ChildItem` and libvips (sharp `toFile`) fail there — use Node `fs` or the Read/Edit tools, and sharp `toBuffer()`.
- Windows PowerShell 5.1: `Invoke-WebRequest` needs `[Net.ServicePointManager]::SecurityProtocol = 'Tls12'`; piping a here-string into `git commit -F -` adds a BOM — write the message to a file with UTF-8 (no BOM) instead. Git writes progress to stderr, so PowerShell reports exit 255 on successful pushes/switches.
