# House of Pets — Devpost draft

> Draft for pasting into Devpost's sections. Anything in [brackets] needs your own words.

**Tagline:** Snap a photo of your pet and get a complete care plan from five specialist AI agents in seconds.

**Try it:** https://project-gibby.com (works on phones, so you can add it to your home screen)

## Inspiration

[Your story: Gibby, and what made pet care confusing or scattered for you. For example: advice on diet, vet care, insurance and supplies is spread across dozens of sites, and most of it is written for dogs and cats only.]

## What it does

House of Pets is a care dashboard for 24 kinds of pets, from dogs, cats and horses to ferrets, sugar gliders, hedgehogs, chickens, chameleons, snakes, axolotls and hermit crabs.

1. **Add your pet by photo.** A Gemini vision agent identifies the species, breed and life stage, and you confirm it. You can also type the details in.
2. **Generate a care plan.** Five specialist agents work at the same time, and each one fills its own card:
   - **Diet**: three food picks (premium to budget) with prices, each one tap from Amazon, and how to feed them
   - **Hygiene**: bathing, dental care and cleanup routines, plus up to three products for each need (toothbrush, toothpaste, shampoo, litter…), linked to Amazon
   - **Health**: checkup schedule, age-based screenings (the pet version of "get a colonoscopy at 45"), care and red flags for known conditions, vaccinations and warning signs
   - **Insurance**: real insurers that actually cover your species, with links, and a heads-up about pre-existing-condition exclusions
   - **Materials**: the must-have supplies for your species plus extras, with "Find nearby" links based on your pet's location
3. **Stay on track with the Care routine**: recurring tasks (feed daily, dental care weekly, senior blood panel every 6 months…) built from the plan, on their own screen: due dates, overdue alerts, a "Done" button that schedules the next one, a way to say when you last did something, and a month calendar of the weekly-and-longer tasks.
4. **Adjust any card.** Ask one specialist for a change ("cheaper options", "she hates baths") and just that card is redone. It's a one-shot request, not a chatbot.

Tell us your pet's exact age and any health conditions (diabetes, arthritis, allergies…), and every agent adapts to them.

It's a dashboard, not a chatbot. You get scannable answers you can act on in seconds, not a conversation to dig through.

## How we built it

- **Five parallel Gemini agents with enforced JSON schemas.** Each category is its own agent with its own system prompt and a strict `responseJsonSchema`, so every card renders from typed data. A plain-code orchestrator runs all five at once with `Promise.all`. We chose that over an LLM router because it's predictable, fast and cheap (about half a cent per full plan).
- **Gemini vision agent** identifies the pet from a photo. The photo is resized in the browser first, and the agent returns species, breed, age and a confidence level. If the animal isn't a supported species, it says so instead of guessing.
- **Grounded answers where hallucination would hurt.** The insurance agent can only pick from a vetted list of real insurers, filtered to the ones that cover the species. A fish gets an honest "no insurers cover this" rather than an invented policy. Must-have supplies per species come from our own list, so they never go missing.
- **Species-aware prompts** for all 24 animals, so fish get water-quality care instead of baths and horses get farrier visits.
- **Resilience:** agents save independently. If one fails, the other four still land, and the card explains what went wrong. Responses missing required fields are rejected, so a bad answer never replaces a good plan.
- **Stack:** Next.js 16 (App Router, TypeScript), Tailwind v4 and shadcn/ui; PostgreSQL on Neon with JSONB for reports; Neon Auth; hosted on DigitalOcean App Platform with auto-deploy from GitHub; custom domain from GoDaddy. It's installable as a phone app (PWA).

## Challenges we ran into

- **API key rejections.** One Gemini API key started returning 401 errors because of a known issue on Google's side with a newer key format, so we had to tell key problems apart from code problems.
- **Free-tier quotas.** The free tier's per-project daily limit ran out quickly with five agents per plan. We added per-agent keys and retry with backoff on 429/503 before moving to a paid plan.
- **Malformed model output.** Early on, an incomplete response could overwrite a good report with a blank card. Validating the required fields before saving fixed it.
- **Scope across 24 species.** Supporting horses, fish and reptiles alongside cats and dogs meant rethinking every category, since not every animal gets baths, vaccines or insurance.

## Accomplishments that we're proud of

- A full plan from five agents arrives in seconds, and each card is short enough to read at a glance.
- Honest answers: the app says "not covered" or "not supported" instead of making things up.
- It's live on a real domain, works on phones, and has polished light and dark themes that pass WCAG AA contrast.
- [Built solo in one weekend.]

## What we learned

- Structured output plus a schema for each agent is far more reliable than one big prompt.
- Grounding the model in a curated list beats asking it to recall facts like which insurers cover rabbits.
- [Anything personal: first time using Neon, DigitalOcean, Gemini vision…]

## What's next for House of Pets

- Reminders for due tasks, and exporting the routine to your phone's calendar
- A "refine" box on each card, to adjust a single category (e.g. "she's allergic to chicken")
- An instant on-device species guess from a lightweight image model, with Gemini still confirming breed and age
- Live location through GPS collar integrations

## Built with

nextjs, typescript, react, tailwindcss, shadcn-ui, postgresql, neon, gemini, google-genai, digitalocean, godaddy, pwa
