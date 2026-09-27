import { generateStructuredJson } from "@/lib/gemini";
import { AGE_STAGES, SPECIES, type AgeStage, type Confidence, type Species } from "@/lib/pets";

// Photo -> species/breed/age, shown to the user to confirm before saving.
// Runs before a pet exists, so it isn't part of the orchestrator's fan-out.

const VISION_SCHEMA = {
  type: "object",
  properties: {
    detected_animal: {
      type: "string",
      description: "The animal in the photo in plain words, e.g. 'golden retriever puppy', 'bearded dragon'. 'none' if there is no animal.",
    },
    species: {
      type: "string",
      enum: [...SPECIES, "unsupported"],
      description:
        "The matching supported species. lizard = geckos, bearded dragons, skinks, iguanas and other lizards except chameleons; chameleon = chameleons; snake = snakes; frog = frogs and toads; axolotl = axolotls; crab = hermit crabs and other pet crabs; bird = pet birds except chickens; chicken = chickens; pig = pigs; sugar_glider = sugar gliders; hamster, guinea_pig, rat, mouse, chinchilla, ferret, hedgehog, squirrel, raccoon = those animals. Use 'unsupported' for any other animal (e.g. turtle, tortoise, gerbil, goat) or if there is no animal.",
    },
    breed: { type: "string", description: "Breed or variety if recognizable, otherwise an empty string." },
    age_stage: { type: "string", enum: [...AGE_STAGES] },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["detected_animal", "species", "breed", "age_stage", "confidence"],
};

type VisionResponse = {
  detected_animal: string;
  species: Species | "unsupported";
  breed: string;
  age_stage: AgeStage;
  confidence: Confidence;
};

export type Identification =
  | { ok: true; species: Species; breed: string | null; age_stage: AgeStage; confidence: Confidence; detected: string }
  | { ok: false; error: string };

export const UNSUPPORTED_MESSAGE = "This animal type is not currently supported by this application";

export async function identifyPet(photoDataUrl: string): Promise<Identification> {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(photoDataUrl);
  if (!match) return { ok: false, error: "That file doesn't look like a photo." };

  const result = await generateStructuredJson<VisionResponse>({
    agent: "vision",
    systemPrompt:
      "You are a veterinary assistant identifying a pet from a photo. Name the animal, map it to one supported species, and estimate breed and age stage (baby, adult, senior). Be honest about confidence. Respond only with data matching the given JSON schema.",
    prompt: "Identify the pet in this photo.",
    schema: VISION_SCHEMA,
    image: { mimeType: match[1], data: match[2] },
  });

  if (result.detected_animal.trim().toLowerCase() === "none") {
    return { ok: false, error: "We couldn't find an animal in that photo. Try another one, or enter the details yourself." };
  }
  if (result.species === "unsupported" || !SPECIES.includes(result.species)) {
    return { ok: false, error: UNSUPPORTED_MESSAGE };
  }
  return {
    ok: true,
    species: result.species,
    breed: result.breed.trim() || null,
    age_stage: result.age_stage,
    confidence: result.confidence,
    detected: result.detected_animal,
  };
}
