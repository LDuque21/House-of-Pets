# House of Pets — project context

ShellHacks 2026 hackathon project. Deadline: **Sep 27, 11:00am EDT** (check current date/time against this — it is close). Solo developer (Luis Duque, GitHub `LDuque21`). Repo: https://github.com/LDuque21/House-of-Pets (public).

Full original spec: [docs/spec.md](docs/spec.md) (includes an "Amendments" section documenting the Postgres/Mongo pivot). This file is the condensed, current-state version — read this first, `docs/spec.md` for the original detail.

## What this is

A pet-care app: user signs up, adds a pet (species/breed/age, no photo yet), then generates an AI-written care plan across five categories (Diet, Hygiene, Health, Insurance, Materials), each rendered as a card, plus a derived task checklist (feeding, bathing, vet checkups, etc.).

## Stack, and why it differs from the original spec

- **Next.js 16 (App Router, TypeScript, `src/` dir) + Tailwind v4 + shadcn/ui** (`base-nova` preset). shadcn was chosen because Neon Auth's UI components already use the same Radix/CSS-variable token system, so the two look consistent for free.
- **Postgres on Neon**, not MongoDB Atlas as the original spec said. The data model is relational (users → pets → care_reports/tasks via FKs); the one semi-structured field (`care_reports.content`) fits `JSONB` fine. MongoDB was in the original spec mainly as an MLH stackable-prize track, not a technical fit. Neon's free tier (no card, scales to zero) beat DigitalOcean Managed Postgres (no free tier) and Supabase (pauses after 7 days idle).
- **Neon Managed Auth** (Better Auth under the hood) for real per-user accounts — needed because multiple people will sign up live at the showcase. **Email + password only** — magic link and OAuth were both deliberately rejected (magic link depends on email delivery landing fast in front of a live judge; Google OAuth needs a registered redirect URI that would break the moment the production domain changes, which happens late in the build order). There is no `users` table in our schema — Neon Auth owns its own `neon_auth` schema; `pets.user_id` stores that auth user's id as plain `TEXT` with no hard FK into it (that schema is managed by Neon's tooling, not ours).
- **Google Gemini** (`@google/genai`, model id `gemini-flash-latest`, resolves to `gemini-3.8-flash`) for the actual care-plan generation. Structured output via `responseJsonSchema` + `responseMimeType: "application/json"` (plain JSON Schema, not Gemini's older OpenAPI-subset `responseSchema`).
- **Vision/photo agent is deliberately deferred.** Pets are added via a manual form (species/breed/age dropdown + notes), not a photo upload. This was an explicit scope call: prioritize the core plan-generation flow over species detection.

## Architecture map

```
src/app/
  page.tsx                    landing page (sign in/up links, or "Your pets" + UserButton if signed in)
  auth/[path]/page.tsx        Better-Auth-UI catch-all (sign-in, sign-up, forgot-password, ...)
  api/auth/[...path]/route.ts Neon Auth's handler
  account/page.tsx            placeholder session-check page (predates /pets, low value now)
  pets/page.tsx                list of the current user's pets
  pets/new/page.tsx            add-pet form (server action, no photo)
  pets/[id]/page.tsx            pet detail: info + "Generate/Regenerate care plan" + cards + task checklist
  pets/actions.ts               createPetAction, generateCarePlanAction (both server actions)
  providers.tsx                 wraps app in NeonAuthUIProvider

src/lib/
  db.ts                        pg Pool singleton (DATABASE_URL)
  pets.ts                      pet CRUD, scoped to user_id
  care-reports.ts               save/list care_reports, task derivation, list tasks
  gemini.ts                     GoogleGenAI client(s) + generateStructuredJson() with 429/503 retry
  agents/
    schemas.ts                  JSON Schemas for all 5 categories
    orchestrator.ts              buildCareHub(pet): Promise.all across 5 category agents, plain code (not an LLM router)
    species-config.ts            per-species prompt context (dog/cat/rabbit)
    insurance-providers.ts        hardcoded real companies + real URLs (model picks from this list, never invents a URL)

src/components/
  animal-silhouettes.tsx       hand-drawn dog/cat/rabbit SVG silhouettes, PawPrint, PetAvatar (all currentColor)
  category-meta.ts             label/icon/tint/blurb per care category (landing, cards, form, task list)
  site-header.tsx              sticky header: logo, "Your pets", sign-in / UserButton
  submit-button.tsx            useFormStatus pending state for server-action forms
  care-report-card.tsx          one card per category
  generate-care-plan-form.tsx   generate button, "specialists working" state, friendly failure messages

src/lib/format.ts               petSummary ("Dog · Beagle · Puppy"), frequencyLabel ("Weekly"), dueLabel ("Tomorrow")
src/app/icon.svg                paw favicon
src/proxy.ts                   Next 16 middleware; protects /account/* and /pets/*
schema.sql                      current target schema (CREATE TABLE IF NOT EXISTS — see caveat below)
scripts/apply-schema.mjs        npm run db:push — applies schema.sql
```

## UI / design system

Friendly, warm look (user asked for a site "catered to animals"). Tokens live in `globals.css`: light is cream + terracotta, dark is cocoa + apricot. Both matter: `NeonAuthUIProvider` wraps the app in next-themes with the OS setting as default. Every text/background pair was checked to WCAG AA (4.5:1) — recheck if you change a color. Extra tokens: category tints (`diet`/`hygiene`/`health`/`insurance`/`materials`, each with a `-soft` badge tone) and species tints (`dog`/`cat`/`rabbit`). Fonts: Nunito for body (`--font-sans`), Fredoka for headings (`--font-display`, used by `font-heading` and all h1–h3). The silhouettes are the user's own artwork: their sheets were cut into one tight-cropped alpha-mask PNG per species in `public/silhouettes/`, and `AnimalSilhouette` paints `currentColor` through the mask (`align="bottom"` for rows, `"center"` in avatars). To add a species, add its mask PNG plus a tint pair in `globals.css` and `SPECIES_TINTS`. The auth provider's wrapper `div` gets `flex flex-1 flex-col` so pages can fill the screen height.

## Database

Postgres on Neon. **Real user data exists now** (a pet named "Gibby" under the user's own account, created while testing) — `schema.sql` is no longer safe to treat as drop-and-recreate. From here on, schema changes are one-off `ALTER` scripts run by hand once, not edits to `schema.sql` that get replayed.

Tables: `pets` (species/breed/age_stage/confidence/photo_url/notes, `user_id` as plain text pointing at Neon Auth's user), `care_reports` (category + JSONB content + model name), `tasks` (derived, not user-entered: task_name/frequency_days/next_due).

Categories are `diet | hygiene | health | insurance | materials` (a `behavior` category was planned, then scrapped in favor of `materials` — a day-to-day shopping list of physical items — before it was ever built; the CHECK constraints were migrated via `ALTER` to reflect this).

## Agent system

Five categories, each one Gemini call with a dedicated system prompt + JSON schema, run in parallel via `Promise.all` (orchestrator is plain async code, explicitly not an LLM router — this was a deliberate spec decision for reliability/speed). Each category's result is independent: one failing doesn't block the others, and the UI (`GenerateCarePlanForm`, a client component using `useActionState`) shows which categories failed and why instead of silently rendering fewer cards. Before saving, the orchestrator also checks the response has the schema's required top-level keys: if the schema never reached Gemini it still answers in JSON, just in its own shape, and saving that would replace the last good report with a blank card (this happened once, Sep 26 — see Working agreement).

Content is tuned for brevity per explicit user feedback (a new pet owner should be able to scan it in seconds, not read paragraphs):
- **Diet**: one primary food + 2-3 brand examples + price range, one short feeding-instruction sentence, max 2 cautions.
- **Hygiene**: bathing frequency, dental care + treats, litter/cleanup frequency, supplies list.
- **Health**: checkup frequency, up to 3 vaccinations, up to 4 warning signs (this section was explicitly liked as-is, just shortened elsewhere).
- **Insurance**: providers **chosen from a hardcoded real allowlist** (Trupanion, Healthy Paws, Embrace, Figo, ASPCA, Nationwide — real URLs verified via web search, hardcoded in `insurance-providers.ts`) with model-estimated monthly cost range + one note each. The model never generates the company name or URL itself. Each provider records which species it insures, and the provider enum is built per pet (`insuranceSchema(species)` in `schemas.ts`, listed in the prompt too): dogs/cats get 3-5 of all six; rabbits, birds, reptiles and hamsters get only Nationwide (avian & exotic plan); horses get only ASPCA (equine, limited states). Nothing on the list covers fish, so the orchestrator skips the insurance agent for fish and saves an empty list; the card explains.
- **Materials**: 5-8 physical items (food, litter box, toys, dental tools, cleanup supplies) with price ranges.

Tasks are derived from report content after each successful category (see `deriveTasksForCategory` in `care-reports.ts`): diet → daily feeding; hygiene → up to 3 tasks (bath/teeth/cleanup); health → vet checkup; insurance and materials produce no recurring tasks. Frequency fields are `integer` in the schemas because `tasks.frequency_days` is an INTEGER column (a fractional answer like 0.5 used to fail the insert); `wholeDays()` also rounds defensively, and 0 means "not routinely needed" — no task, and the card shows "as needed".

## Gemini quota/cost — resolved, but know the history

Free tier is **20 requests/day per project**, not just a per-minute limit — this was discovered by actually exhausting it during testing, not read in docs. The user has now enabled a paid plan ($5), which removes this ceiling; real cost is negligible (~$0.75/1M input, $3.75/1M output tokens for `gemini-3.8-flash` — roughly half a cent per full 5-category generation).

**API key type (Sep 26):** `GEMINI_API_KEY` is one of Google's new `AQ.` auth keys (AI Studio has only issued these since May 28, 2026). Billing is per Google Cloud project, so a key never needs regenerating for billing. Google has a widely reported, unresolved issue where `AQ.` keys are rejected with 401 `ACCESS_TOKEN_TYPE_UNSUPPORTED` on generativelanguage.googleapis.com: this key worked at 6:29pm Sep 26, then failed that way ~10 minutes later with no local change (same dev server process, `.env.local`, and SDK). That 401 is Google-side, not an app bug — don't re-debug the code for it.

`gemini.ts` also supports **optional per-category API keys** (`GEMINI_API_KEY_DIET`, `_HYGIENE`, `_HEALTH`, `_INSURANCE`, `_MATERIALS`, each falling back to `GEMINI_API_KEY`) for splitting load across separate Google Cloud projects if ever needed again — but this only helps if each key is from a genuinely different project; multiple keys from one project share one quota pool. Not needed now that billing is on, but the code supports it.

## Explicit scope decisions (don't relitigate these without asking)

- **No persistent chatbot** — this is a hard Microsoft-challenge requirement ("core experience is a dashboard, not a chat window"), not a style preference. The per-pet-card refine control (planned, not yet built) is the only sanctioned free-text-to-LLM surface, and it's scoped to one card at a time.
- **Vision agent: built Sep 26 at the user's request** (`lib/agents/vision.ts`). On the add-pet form, uploading a photo sends it (resized in the browser to ~640px JPEG) to Gemini, which returns species/breed/age/confidence to prefill the form for the user to confirm. A species outside the supported list returns exactly "This animal type is not currently supported by this application" (user-specified wording). It runs before a pet exists, so it's separate from the orchestrator's fan-out.
- **Images are stored inline as data: URLs** — pet photos in `pets.photo_url`, profile photos on the Neon Auth user record (Better Auth UI's `avatar` option, edited at `/account/settings`). No object storage; keep images small.
- **Microchips can't give GPS** (they're passive RFID). Location is user-set per pet (typed place or browser geolocation, `pets.location_label/latitude/longitude`) and used for Google Maps search links ("find nearby"), no Maps API key.
- **Species: dog, cat, rabbit, fish, bird, horse, reptile, hamster** — the user expanded this from the spec's dog/cat/rabbit on Sep 26 (the `pets_species_check` constraint was widened by a one-off ALTER; `SPECIES` in `lib/pets.ts` is the code-side list). Categories stay locked to the five above.
- **Auth is email+password only.** Don't add magic link or OAuth without asking — both were explicitly rejected for live-demo reliability reasons (see Stack section above).

## Current status (update this section as work continues)

**Done and pushed:** Neon Postgres schema, Neon Managed Auth (sign up/in/out, protected routes), pet CRUD (no photo), all 5 care-plan agents with concise output and real insurance links, task derivation, partial-failure UI, shadcn/ui integration.

**Installable web app (PWA), Sep 27 ~1am:** `app/manifest.ts` (standalone, opens at `/pets`), icons in `public/icons/` + `app/apple-icon.png`, iPhone `appleWebApp` metadata and theme colors in `layout.tsx`, header compacted below `sm` (paw icon for "Your pets", "Sign in" hidden). Deliberately no service worker/offline mode. App-store builds were ruled out for time/cost. Custom domain https://project-gibby.com is live (DigitalOcean DNS; nameservers switched at GoDaddy); `www` not yet added in the app's Networking → Domains.

**Deployed Sep 27 (~midnight):** DigitalOcean App Platform, $5 plan (512 MB, 1 container), auto-deploys on push to `main` — https://house-of-pets-qmu5o.ondigitalocean.app. Env vars set in the DO dashboard (not the spec). That origin is in Neon Auth's trusted domains (branch `br-damp-bread-b5fzf53l`, project `restless-boat-46160363`); add the GoDaddy domain there too once it's connected. Gemini key working again as of Sep 26 10:53pm (new AQ. key).

**Feature batch Sep 26 ~8pm (build-verified, nothing live-tested — Gemini key still broken):** photo identification on add-pet, pet photos, edit + remove pet (`/pets/[id]/edit`), profile photo via `/account/settings`, light/dark toggle in the header, pet location + "find nearby" links in the materials card, per-species must-have supplies (`lib/agents/essentials.ts`: passed to the materials agent and always shown, merged with the agent's extras), "Care routine" shows frequencies only (no due dates), hero sample chips removed. DB: `pets.location_label/latitude/longitude` added by one-off ALTER.

**Species expansion Sep 26 evening (build-verified, not yet live-tested with Gemini):** five new species with their own prompt context, insurer coverage, baby labels ("Foal", "Hatchling"...), tints and silhouettes; task names generalized to "Dental care" / "Cleanup".

**UI redesign Sep 26 evening (build-verified, not yet checked in a browser):** landing page, header/footer, pets list, add-pet form with species/age tiles, pet dashboard with care cards + "Upcoming care", sign-in pages.

**Fixed Sep 26 evening (build-verified, not yet live-tested):** integer frequencies + defensive rounding in task derivation, species-filtered insurance providers, `cross-env` moved to `dependencies` for DigitalOcean.

**Plan agreed Sep 26 evening** (deploy moved ahead of the remaining features on purpose — deploy risk outweighs feature value this close to the deadline): live test → deploy to DigitalOcean → Devpost draft + README refresh → checkable tasks → demo polish (nav header, skeleton cards, landing page) → refine agent → vision agent (only if the user reopens it) → GoDaddy domain, video, submit by ~10am.

**Pending / not yet done:**
- Full live end-to-end verification of the reworked (concise) agent output has not happened yet — billing was just enabled and testing is paused pending explicit authorization (see below). Existing saved reports for the test pet "Biscuit" are stale (old verbose schema); they'll display with some blank fields until regenerated.
- Deploying: add every production origin (the DigitalOcean URL, later the GoDaddy domain) to Neon Auth's trusted domains (`neon neon-auth domain add https://...`), or sign-in fails with `invalid domain`.
- Refine control (per-card edit/ask box) — planned, not built.
- Vision/photo agent — deferred.
- DigitalOcean deployment, GoDaddy domain registration, demo video, Devpost writeup — not started (last steps in the build order).
- `/account` page is a low-value leftover from before `/pets` existed; harmless but could be removed.

## Working agreement (current, as of this file's last edit)

**Do not run live tests — dev server, browser, or anything that calls the Gemini API — without asking first.** Silent build/typecheck (`npm run build`) is still fine since it costs nothing and doesn't touch the paid API. This was an explicit instruction after billing was enabled; don't assume it has lapsed without being told.

Also: once a dev server is started for testing, leave it running afterward rather than stopping it — the user tests concurrently in their own browser against the same server.

Because of that, the dev server hot-reloads each file the moment it's saved, and a test that lands mid-way through a multi-file edit runs a mix of old and new code. That's exactly what produced a blank insurance card on Sep 26 (new `schemas.ts` + old `orchestrator.ts` sent Gemini no schema). Tell the user before starting a multi-file edit and when it's done, and order edits so every intermediate state still runs.

## Environment

`.env.local` (gitignored) needs: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_BRANCH` (all pulled via `neon link`/`neon config apply`), `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL` (same), `NEON_AUTH_COOKIE_SECRET` (generated manually, not injected), `GEMINI_API_KEY`. See `.env.example` for the optional per-category Gemini keys.

Commands: `npm run dev`, `npm run build`, `npm run db:push` (applies `schema.sql` — see the caveat above about it no longer being safe to treat as authoritative for changes to existing tables).

## Environment quirks worth knowing (Windows-specific, already solved — don't re-debug these)

- Files under `AppData\Roaming` are transparently EFS-encrypted for this user account. Any *copy* of an encrypted file (Node's `fs.copyFile`, PowerShell's `Copy-Item`) fails with a cryptic `UNKNOWN`/`EXDEV` error; plain reads and fresh writes work fine. This is why `create-next-app` had to be worked around by reading template files and writing fresh copies instead of letting it copy them.
- `NEXT_TELEMETRY_DISABLED=1` is baked into the npm scripts via `cross-env` for the same reason (first-run telemetry config write hit the same issue). `cross-env` is deliberately a runtime `dependency`, not a devDependency: DigitalOcean App Platform prunes devDependencies after the build, and `npm start` needs it.
- `node`/`npm` aren't on the shell PATH that Claude's tools get; prepend `C:\Program Files\nodejs` (e.g. `$env:Path = "C:\Program Files\nodejs;" + $env:Path`).
