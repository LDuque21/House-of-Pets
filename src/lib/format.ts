import type { Pet, Species } from "@/lib/pets";

// Friendly labels for pets, task frequencies and nearby-store links.

export const SPECIES_LABELS: Record<Species, string> = {
  dog: "Dog",
  cat: "Cat",
  rabbit: "Rabbit",
  fish: "Fish",
  bird: "Bird",
  horse: "Horse",
  reptile: "Reptile",
  hamster: "Hamster",
  guinea_pig: "Guinea pig",
  rat: "Rat",
  chinchilla: "Chinchilla",
  raccoon: "Raccoon",
};
const BABY_LABELS: Record<Species, string> = {
  dog: "Puppy",
  cat: "Kitten",
  rabbit: "Kit",
  fish: "Fry",
  bird: "Chick",
  horse: "Foal",
  reptile: "Hatchling",
  hamster: "Pup",
  guinea_pig: "Pup",
  rat: "Pup",
  chinchilla: "Kit",
  raccoon: "Kit",
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
