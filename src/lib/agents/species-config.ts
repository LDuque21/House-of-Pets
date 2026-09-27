import type { Species } from "@/lib/pets";

// Per-species context folded into every sub-agent prompt. Static and
// code-only by design (not admin-editable) -- see spec section 5.
export const SPECIES_CONFIG: Record<Species, { context: string }> = {
  dog: {
    context:
      "Dogs are domesticated carnivores with omnivorous diets. Needs vary widely by breed size and activity level.",
  },
  cat: {
    context:
      "Cats are obligate carnivores and require taurine in their diet. They are typically litter-trained indoor animals.",
  },
  rabbit: {
    context:
      "Rabbits are herbivorous lagomorphs with continuously growing teeth; unlimited hay access is critical for gut and dental health.",
  },
  fish: {
    context:
      "Pet fish live in aquariums; water quality (temperature, pH, ammonia and nitrite, regular partial water changes, filter care) matters more than anything else. Needs differ between freshwater and saltwater species. Fish are never bathed or brushed.",
  },
  bird: {
    context:
      "Pet birds (budgies, cockatiels, parrots) need a pellet-based diet with fresh vegetables and limited seeds, daily social time and out-of-cage exercise, and a clean cage. Birds hide illness, so subtle changes matter, and they need an avian vet. Fumes from nonstick cookware are toxic to them.",
  },
  horse: {
    context:
      "Horses are large herbivores that need near-constant forage (hay or pasture), fresh water, a farrier every 6-8 weeks, yearly dental floating, deworming and vaccines from an equine vet, daily grooming, and stall or paddock mucking.",
  },
  reptile: {
    context:
      "Pet reptiles (geckos, bearded dragons, snakes, turtles) are ectotherms: they depend on the right enclosure temperature gradient, UVB lighting for many species, and correct humidity. Diets vary widely by species (insects, rodents, greens). They aren't bathed like mammals, though some benefit from shallow soaks, and they need an exotics vet.",
  },
  hamster: {
    context:
      "Hamsters are small nocturnal rodents with continuously growing teeth. They need a large enclosure with deep bedding, a solid exercise wheel, chew items, and a pellet-based diet with small amounts of fresh food. They are usually solitary and are never bathed in water (a sand bath instead).",
  },
};
