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

src/proxy.ts                   Next 16 middleware; protects /account/* and /pets/*
schema.sql                      current target schema (CREATE TABLE IF NOT EXISTS — see caveat below)
scripts/apply-schema.mjs        npm run db:push — applies schema.sql
```

## Database

Postgres on Neon. **Real user data exists now** (a pet named "Gibby" under the user's own account, created while testing) — `schema.sql` is no longer safe to treat as drop-and-recreate. From here on, schema changes are one-off `ALTER` scripts run by hand once, not edits to `schema.sql` that get replayed.

Tables: `pets` (species/breed/age_stage/confidence/photo_url/notes, `user_id` as plain text pointing at Neon Auth's user), `care_reports` (category + JSONB content + model name), `tasks` (derived, not user-entered: task_name/frequency_days/next_due).

Categories are `diet | hygiene | health | insurance | materials` (a `behavior` category was planned, then scrapped in favor of `materials` — a day-to-day shopping list of physical items — before it was ever built; the CHECK constraints were migrated via `ALTER` to reflect this).

## Agent system

Five categories, each one Gemini call with a dedicated system prompt + JSON schema, run in parallel via `Promise.all` (orchestrator is plain async code, explicitly not an LLM router — this was a deliberate spec decision for reliability/speed). Each category's result is independent: one failing doesn't block the others, and the UI (`GenerateCarePlanForm`, a client component using `useActionState`) shows which categories failed and why instead of silently rendering fewer cards.

Content is tuned for brevity per explicit user feedback (a new pet owner should be able to scan it in seconds, not read paragraphs):
- **Diet**: one primary food + 2-3 brand examples + price range, one short feeding-instruction sentence, max 2 cautions.
- **Hygiene**: bathing frequency, dental care + treats, litter/cleanup frequency, supplies list.
- **Health**: checkup frequency, up to 3 vaccinations, up to 4 warning signs (this section was explicitly liked as-is, just shortened elsewhere).
- **Insurance**: 3-5 providers **chosen from a hardcoded real allowlist** (Trupanion, Healthy Paws, Embrace, Figo, ASPCA, Nationwide — real URLs verified via web search, hardcoded in `insurance-providers.ts`) with model-estimated monthly cost range + one note each. The model never generates the company name or URL itself.
- **Materials**: 5-8 physical items (food, litter box, toys, dental tools, cleanup supplies) with price ranges.

Tasks are derived from report content after each successful category (see `deriveTasksForCategory` in `care-reports.ts`): diet → daily feeding; hygiene → up to 3 tasks (bath/teeth/cleanup); health → vet checkup; insurance and materials produce no recurring tasks.

## Gemini quota/cost — resolved, but know the history

Free tier is **20 requests/day per project**, not just a per-minute limit — this was discovered by actually exhausting it during testing, not read in docs. The user has now enabled a paid plan ($5), which removes this ceiling; real cost is negligible (~$0.75/1M input, $3.75/1M output tokens for `gemini-3.8-flash` — roughly half a cent per full 5-category generation).

`gemini.ts` also supports **optional per-category API keys** (`GEMINI_API_KEY_DIET`, `_HYGIENE`, `_HEALTH`, `_INSURANCE`, `_MATERIALS`, each falling back to `GEMINI_API_KEY`) for splitting load across separate Google Cloud projects if ever needed again — but this only helps if each key is from a genuinely different project; multiple keys from one project share one quota pool. Not needed now that billing is on, but the code supports it.

## Explicit scope decisions (don't relitigate these without asking)

- **No persistent chatbot** — this is a hard Microsoft-challenge requirement ("core experience is a dashboard, not a chat window"), not a style preference. The per-pet-card refine control (planned, not yet built) is the only sanctioned free-text-to-LLM surface, and it's scoped to one card at a time.
- **No vision/photo agent for now** — manual add-pet form only. May be revisited if time remains.
- **Species locked to dog/cat/rabbit**, categories locked to the five above. Both were explicit cuts in the original spec for time; the user re-opened materials-vs-behavior once (see above) but nothing else.
- **Auth is email+password only.** Don't add magic link or OAuth without asking — both were explicitly rejected for live-demo reliability reasons (see Stack section above).

## Current status (update this section as work continues)

**Done and pushed:** Neon Postgres schema, Neon Managed Auth (sign up/in/out, protected routes), pet CRUD (no photo), all 5 care-plan agents with concise output and real insurance links, task derivation, partial-failure UI, shadcn/ui integration.

**Pending / not yet done:**
- Full live end-to-end verification of the reworked (concise) agent output has not happened yet — billing was just enabled and testing is paused pending explicit authorization (see below). Existing saved reports for the test pet "Biscuit" are stale (old verbose schema); they'll display with some blank fields until regenerated.
- Refine control (per-card edit/ask box) — planned, not built.
- Vision/photo agent — deferred.
- DigitalOcean deployment, GoDaddy domain registration, demo video, Devpost writeup — not started (last steps in the build order).
- `/account` page is a low-value leftover from before `/pets` existed; harmless but could be removed.

## Working agreement (current, as of this file's last edit)

**Do not run live tests — dev server, browser, or anything that calls the Gemini API — without asking first.** Silent build/typecheck (`npm run build`) is still fine since it costs nothing and doesn't touch the paid API. This was an explicit instruction after billing was enabled; don't assume it has lapsed without being told.

Also: once a dev server is started for testing, leave it running afterward rather than stopping it — the user tests concurrently in their own browser against the same server.

## Environment

`.env.local` (gitignored) needs: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_BRANCH` (all pulled via `neon link`/`neon config apply`), `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL` (same), `NEON_AUTH_COOKIE_SECRET` (generated manually, not injected), `GEMINI_API_KEY`. See `.env.example` for the optional per-category Gemini keys.

Commands: `npm run dev`, `npm run build`, `npm run db:push` (applies `schema.sql` — see the caveat above about it no longer being safe to treat as authoritative for changes to existing tables).

## Environment quirks worth knowing (Windows-specific, already solved — don't re-debug these)

- Files under `AppData\Roaming` are transparently EFS-encrypted for this user account. Any *copy* of an encrypted file (Node's `fs.copyFile`, PowerShell's `Copy-Item`) fails with a cryptic `UNKNOWN`/`EXDEV` error; plain reads and fresh writes work fine. This is why `create-next-app` had to be worked around by reading template files and writing fresh copies instead of letting it copy them.
- `NEXT_TELEMETRY_DISABLED=1` is baked into the npm scripts via `cross-env` for the same reason (first-run telemetry config write hit the same issue).
