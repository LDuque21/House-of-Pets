/// Head AI agent. This one will dictate and receieve the information from the other agents called

import type { Pet } from "@/lib/pets";
import { generateStructuredJson } from "@/lib/gemini";
import { schemaFor, type Category } from "@/lib/agents/schemas";
import { SPECIES_CONFIG } from "@/lib/agents/species-config";
import { INSURANCE_PROVIDERS, providersFor } from "@/lib/agents/insurance-providers";
import { ESSENTIALS } from "@/lib/agents/essentials";
import { saveCareReport, deriveAndSaveTasks } from "@/lib/care-reports";

const CATEGORY_INSTRUCTIONS: Record<Category, string> = {
  diet:
    "You are a veterinary nutrition specialist. Recommend 3 specific foods the owner can buy on Amazon, as real products (brand + product line, e.g. 'Hill's Science Diet Adult Indoor Dry Cat Food'), each right for this pet's species, age and any health conditions. Give the package size, a realistic Amazon price range for that package, and a few words on why. Vary them (e.g. a premium, a mid-range and a budget pick). Then one short feeding instruction sentence (e.g. 'Feed twice a day, morning and evening') and at most 2 cautions.",
  hygiene:
    "You are a pet grooming and husbandry specialist. Cover: bathing, dental care, and cleanup of the litter box, cage, tank, or stall. Use 0 days for any routine this species doesn't need. Each notes field is one short sentence. Then list the 2-4 hygiene products this pet actually needs (e.g. toothbrush, toothpaste, shampoo, brush, litter, water conditioner, sand bath), each with up to 3 real products sold on Amazon (brand + product line, specific to this species) and a realistic Amazon price range. Skip generic household items like trash bags, paper towels or gloves.",
  health:
    "You are a veterinary health specialist. Give vet checkup frequency, up to 3 key vaccinations (none if this species isn't routinely vaccinated), and up to 4 concrete warning signs a first-time owner should watch for at this pet's age. " +
    "Screenings: like people get a colonoscopy from age 45, pets need age-based screenings (e.g. senior blood panels and urinalysis, blood pressure, thyroid checks, dental X-rays, eye exams, heart checks). List up to 3 recommended NOW at this pet's age, beyond the routine exam, each with how often and what it catches. If the pet is not yet a senior, list up to 2 upcoming milestones with the age they start; otherwise leave that empty. " +
    "Condition care: for each known health condition (up to 3), give day-to-day management, how often to see the vet about it, and red flags that need a vet urgently. Leave it empty if there are no known conditions. Never contradict a vet's existing treatment plan.",
  insurance:
    "You are a pet insurance advisor. Recommend providers only from the allowed list below; all of them insure this species, and a short list means few insurers do. For each, estimate a realistic monthly cost range and write one short note. If the pet has known health conditions, the notes must mention how that provider handles pre-existing conditions (most exclude them). Do not invent providers.",
  materials:
    "You are a pet supplies advisor. List what a new owner needs day-to-day (food, housing or enclosure, bedding or litter, toys or enrichment, cleaning supplies) with a one-line purpose and realistic price range each, including anything a known health condition calls for (e.g. a ramp for arthritis). For time-based needs like daily play, the price range is 0 to 0.",
};

function petProfileLines(pet: Pet): string[] {
  const age = pet.age_years != null ? ` Exact age: ${pet.age_years === 0 ? "under 1 year" : `${pet.age_years} years`}.` : "";
  return [
    `Species: ${pet.species}${pet.breed ? ` (${pet.breed})` : ""}. Age stage: ${pet.age_stage}.${age}`,
    pet.conditions
      ? `Known health conditions (from the owner): ${pet.conditions}. Take them into account.`
      : "Known health conditions: none reported.",
  ];
}

function allowedProvidersLine(pet: Pet): string {
  const providers = providersFor(pet.species).map((key) => `${key} (${INSURANCE_PROVIDERS[key].name})`);
  return `Allowed providers, as provider_key (company): ${providers.join(", ")}.`;
}

function buildSystemPrompt(category: Category, pet: Pet): string {
  const speciesContext = SPECIES_CONFIG[pet.species].context;
  return [
    CATEGORY_INSTRUCTIONS[category],
    ...petProfileLines(pet),
    `Species context: ${speciesContext}`,
    pet.notes ? `Owner-provided notes: ${pet.notes}` : "",
    category === "insurance" ? allowedProvidersLine(pet) : "",
    category === "materials"
      ? `Must-have items -- always include every one, using these exact names, with a price range: ${ESSENTIALS[pet.species].map((e) => e.name).join("; ")}. Then add up to 4 more items this particular pet needs.`
      : "",
    "Write for a first-time pet owner: be concise and concrete, not exhaustive. Short plain sentences, no filler, no long paragraphs. Respond only with data matching the given JSON schema.",
  ]
    .filter(Boolean)
    .join("\n");
}

export type CategoryResult =
  | { category: Category; status: "ok"; content: Record<string, unknown> }
  | { category: Category; status: "error"; error: string };

async function runCategoryAgent(category: Category, pet: Pet): Promise<CategoryResult> {
  try {
    // No insurer on the allowlist covers this species (fish): skip Gemini and
    // save an empty list, so the card says so instead of the model inventing one.
    if (category === "insurance" && providersFor(pet.species).length === 0) {
      const content = { category, providers: [] };
      await saveCareReport(pet.id, category, content);
      return { category, status: "ok", content };
    }

    const schema = schemaFor(category, pet.species);
    const content = await generateStructuredJson<Record<string, unknown>>({
      agent: category,
      systemPrompt: buildSystemPrompt(category, pet),
      prompt: `Generate the ${category} plan for ${pet.name}.`,
      schema,
    });
    // If the schema never reaches Gemini, it still answers in JSON, just in its
    // own shape. Saving that would replace the last good report with a blank card.
    const missing = schema.required.filter((key) => !(key in content));
    if (missing.length > 0) {
      throw new Error(`Response didn't match the schema (missing ${missing.join(", ")})`);
    }
    await saveCareReport(pet.id, category, content);
    await deriveAndSaveTasks(pet.id, category, content);
    return { category, status: "ok", content };
  } catch (err) {
    console.error(`[agent:${category}] failed for pet ${pet.id}:`, err);
    return {
      category,
      status: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// Orchestrator is plain async code, not an LLM call -- see spec section 3.
export async function buildCareHub(pet: Pet): Promise<CategoryResult[]> {
  const categories: Category[] = ["diet", "hygiene", "health", "insurance", "materials"];
  return Promise.all(categories.map((category) => runCategoryAgent(category, pet)));
}
