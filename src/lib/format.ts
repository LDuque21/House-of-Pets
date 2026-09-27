import type { Pet, Species } from "@/lib/pets";

// Friendly labels for pets, task frequencies and nearby-store links.

// How species are grouped wherever they're listed (species picker, landing
// page): by kind of animal, with the water animals together at the end.
// Keep in sync with SPECIES in lib/pets.ts (same order).
export const SPECIES_GROUPS: { label: string; species: Species[] }[] = [
  {
    label: "Mammals",
    species: [
      "dog", "cat", "horse", "pig", "rabbit", "ferret", "raccoon", "squirrel",
      "sugar_glider", "hedgehog", "guinea_pig", "chinchilla", "hamster", "rat", "mouse",
    ],
  },
  { label: "Birds", species: ["bird", "chicken"] },
  { label: "Reptiles", species: ["lizard", "chameleon", "snake"] },
  { label: "Amphibians", species: ["frog", "axolotl"] },
  { label: "Aquatic", species: ["fish", "crab"] },
];

export const SPECIES_LABELS: Record<Species, string> = {
  dog: "Dog",
  cat: "Cat",
  horse: "Horse",
  pig: "Pig",
  rabbit: "Rabbit",
  ferret: "Ferret",
  raccoon: "Raccoon",
  squirrel: "Squirrel",
  sugar_glider: "Sugar glider",
  hedgehog: "Hedgehog",
  guinea_pig: "Guinea pig",
  chinchilla: "Chinchilla",
  hamster: "Hamster",
  rat: "Rat",
  mouse: "Mouse",
  bird: "Bird",
  chicken: "Chicken",
  lizard: "Lizard",
  chameleon: "Chameleon",
  snake: "Snake",
  frog: "Frog",
  axolotl: "Axolotl",
  fish: "Fish",
  crab: "Crab",
};
const BABY_LABELS: Record<Species, string> = {
  dog: "Puppy",
  cat: "Kitten",
  horse: "Foal",
  pig: "Piglet",
  rabbit: "Kit",
  ferret: "Kit",
  raccoon: "Kit",
  squirrel: "Kit",
  sugar_glider: "Joey",
  hedgehog: "Hoglet",
  guinea_pig: "Pup",
  chinchilla: "Kit",
  hamster: "Pup",
  rat: "Pup",
  mouse: "Pup",
  bird: "Chick",
  chicken: "Chick",
  lizard: "Hatchling",
  chameleon: "Hatchling",
  snake: "Hatchling",
  frog: "Froglet",
  axolotl: "Juvenile",
  fish: "Fry",
  crab: "Juvenile",
};

function yearsLabel(years: number | null): string | null {
  if (years == null) return null;
  if (years === 0) return "Under 1 year";
  return years === 1 ? "1 year" : `${years} years`;
}

// e.g. "Cat · Tabby · Adult", "Dog · Puppy", "Dog · Beagle · Senior · 9 years"
export function petSummary(pet: Pick<Pet, "species" | "breed" | "age_stage" | "age_years">): string {
  const age =
    pet.age_stage === "baby" ? BABY_LABELS[pet.species] : pet.age_stage === "senior" ? "Senior" : "Adult";
  return [SPECIES_LABELS[pet.species], pet.breed, age, yearsLabel(pet.age_years)].filter(Boolean).join(" · ");
}

// "diabetes, arthritis" -> ["diabetes", "arthritis"]
export function conditionList(conditions: string | null): string[] {
  return (conditions ?? "")
    .split(/[,;\n]/)
    .map((c) => c.trim())
    .filter(Boolean);
}

// An Amazon search for the exact product name. The model can't know real
// product IDs, so a product-page link would be invented; a search always lands.
export function amazonSearchUrl(productName: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(productName)}`;
}

// 0 (or missing) is the schemas' "not routinely needed".
export function frequencyLabel(days: number | null | undefined): string {
  if (!days || days <= 0) return "As needed";
  if (days === 1) return "Daily";
  if (days === 7) return "Weekly";
  if (days >= 28 && days <= 31) return "Monthly";
  if (days >= 360 && days <= 366) return "Yearly";
  if (days % 7 === 0 && days < 60) return `Every ${days / 7} weeks`;
  return `Every ${days} days`;
}

// Google Maps search for `what` near where the pet lives (GPS if set, else the
// typed place). Plain URL, so no Maps API key is needed.
export function nearbySearchUrl(
  what: string,
  home: Pick<Pet, "location_label" | "latitude" | "longitude">
): string | null {
  const where =
    home.latitude != null && home.longitude != null ? `${home.latitude},${home.longitude}` : home.location_label;
  if (!where) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${what} near ${where}`)}`;
}
