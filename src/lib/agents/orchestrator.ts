import type { Pet } from "@/lib/pets";
import { generateStructuredJson } from "@/lib/gemini";
import { schemaFor, type Category } from "@/lib/agents/schemas";
import { SPECIES_CONFIG } from "@/lib/agents/species-config";
import { INSURANCE_PROVIDERS, providersFor } from "@/lib/agents/insurance-providers";
import { ESSENTIALS } from "@/lib/agents/essentials";
import { saveCareReport, deriveAndSaveTasks } from "@/lib/care-reports";

const CATEGORY_INSTRUCTIONS: Record<Category, string> = {
  diet:
    "You are a veterinary nutrition specialist. Recommend ONE primary food with 2-3 brand examples and a realistic monthly price range, plus one short feeding instruction sentence (e.g. 'Feed twice a day, morning and evening'). At most 2 cautions.",
  hygiene:
    "You are a pet grooming and husbandry specialist. Cover: bathing, dental care (with treats or chews if relevant), and cleanup of the litter box, cage, tank, or stall. Use 0 days for any routine this species doesn't need. Each notes field is one short sentence.",
  health:
    "You are a veterinary health specialist. Give vet checkup frequency, up to 3 key vaccinations (none if this species isn't routinely vaccinated), and up to 4 concrete warning signs of illness a first-time owner should watch for.",
  insurance:
    "You are a pet insurance advisor. Recommend providers only from the allowed list below; all of them insure this species, and a short list means few insurers do. For each, estimate a realistic monthly cost range and write one short note. Do not invent providers.",
  materials:
    "You are a pet supplies advisor. List what a new owner needs day-to-day (food, housing or enclosure, bedding or litter, toys or enrichment, cleaning supplies) with a one-line purpose and realistic price range each. For time-based needs like daily play, the price range is 0 to 0.",
};

function allowedProvidersLine(pet: Pet): string {
  const providers = providersFor(pet.species).map((key) => `${key} (${INSURANCE_PROVIDERS[key].name})`);
  return `Allowed providers, as provider_key (company): ${providers.join(", ")}.`;
}

function buildSystemPrompt(category: Category, pet: Pet): string {
  const speciesContext = SPECIES_CONFIG[pet.species].context;
  return [
    CATEGORY_INSTRUCTIONS[category],
    `Species: ${pet.species}${pet.breed ? ` (${pet.breed})` : ""}. Age stage: ${pet.age_stage}.`,
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
