import type { Pet } from "@/lib/pets";
import { generateStructuredJson } from "@/lib/gemini";
import { CATEGORY_SCHEMAS, type Category } from "@/lib/agents/schemas";
import { SPECIES_CONFIG } from "@/lib/agents/species-config";
import { saveCareReport, deriveAndSaveTasks } from "@/lib/care-reports";

const CATEGORY_INSTRUCTIONS: Record<Category, string> = {
  diet:
    "You are a veterinary nutrition specialist. Produce a personalized diet plan: food recommendations with brand examples, feeding frequency, and cautions.",
  hygiene:
    "You are a pet grooming and hygiene specialist. Produce a personalized hygiene routine: recurring tasks with frequency in days, and required supplies.",
  health:
    "You are a veterinary health specialist. Produce a personalized health plan: vet checkup cadence, expected vaccinations, and warning signs of illness.",
  insurance:
    "You are a pet insurance advisor. Produce personalized guidance: relevant coverage types, an estimated monthly cost range in USD, and notes.",
};

function buildSystemPrompt(category: Category, pet: Pet): string {
  const speciesContext = SPECIES_CONFIG[pet.species].context;
  return [
    CATEGORY_INSTRUCTIONS[category],
    `Species: ${pet.species}${pet.breed ? ` (${pet.breed})` : ""}. Age stage: ${pet.age_stage}.`,
    `Species context: ${speciesContext}`,
    pet.notes ? `Owner-provided notes: ${pet.notes}` : "",
    "Respond only with data matching the given JSON schema. Be specific and practical, not generic.",
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
  const categories: Category[] = ["diet", "hygiene", "health", "insurance"];
  return Promise.all(categories.map((category) => runCategoryAgent(category, pet)));
}
