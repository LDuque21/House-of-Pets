import type { Pet } from "@/lib/pets";
import { generateStructuredJson } from "@/lib/gemini";
import { CATEGORY_SCHEMAS, type Category } from "@/lib/agents/schemas";
import { SPECIES_CONFIG } from "@/lib/agents/species-config";
import { saveCareReport, deriveAndSaveTasks } from "@/lib/care-reports";

const CATEGORY_INSTRUCTIONS: Record<Category, string> = {
  diet:
    "You are a veterinary nutrition specialist. Recommend ONE primary food with 2-3 brand examples and a realistic monthly price range, plus one short feeding instruction sentence (e.g. 'Feed twice a day, morning and evening'). At most 2 cautions.",
  hygiene:
    "You are a pet grooming specialist. Cover: bathing frequency, dental care frequency + dental treats, and litter box or waste cleanup frequency. Each notes field is one short sentence.",
  health:
    "You are a veterinary health specialist. Give vet checkup frequency, up to 3 key vaccinations, and up to 4 concrete warning signs of illness a first-time owner should watch for.",
  insurance:
    "You are a pet insurance advisor. Choose 3-5 providers from the given allowlist that plausibly cover this species, and estimate a realistic monthly cost range and one short note for each. Do not invent providers.",
  materials:
    "You are a pet supplies advisor. List 5-8 physical items a new owner needs day-to-day (food, litter box or waste bags, toys, dental care tools, cleanup supplies) with a one-line purpose and realistic price range each.",
};

function buildSystemPrompt(category: Category, pet: Pet): string {
  const speciesContext = SPECIES_CONFIG[pet.species].context;
  return [
    CATEGORY_INSTRUCTIONS[category],
    `Species: ${pet.species}${pet.breed ? ` (${pet.breed})` : ""}. Age stage: ${pet.age_stage}.`,
    `Species context: ${speciesContext}`,
    pet.notes ? `Owner-provided notes: ${pet.notes}` : "",
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
    const content = await generateStructuredJson<Record<string, unknown>>({
      category,
      systemPrompt: buildSystemPrompt(category, pet),
      prompt: `Generate the ${category} plan for ${pet.name}.`,
      schema: CATEGORY_SCHEMAS[category],
    });
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
