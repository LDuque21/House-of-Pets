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
  guinea_pig: {
    context:
      "Guinea pigs are social herbivorous rodents best kept in pairs. They can't make their own vitamin C, so they need it daily from fresh vegetables and fortified guinea pig pellets; unlimited hay keeps their ever-growing teeth and gut healthy. They need a large cage (7.5+ sq ft for two), fleece or paper bedding and hides, nail trims, and rarely need baths.",
  },
  rat: {
    context:
      "Pet (fancy) rats are intelligent, social rodents that should live in pairs or groups, with a large multi-level cage, daily out-of-cage time, and a lab-block diet plus small amounts of fresh food. They're prone to respiratory infections and mammary tumors, groom themselves (baths are rarely needed), and live about 2-3 years, so they're seniors from around age 2. They need an exotics vet.",
  },
  chinchilla: {
    context:
      "Chinchillas are crepuscular Andean rodents with extremely dense fur: they must never get wet, and clean themselves with dust baths (chinchilla dust, never sand) a few times a week. They need unlimited hay, plain chinchilla pellets, chew items for ever-growing teeth, and a tall multi-level cage kept below about 75°F, since they overheat easily. They live 10-20 years and need an exotics vet.",
  },
  raccoon: {
    context:
      "Raccoons are clever, curious omnivores. Many live free-roaming in the home rather than in an enclosure, so a raccoon-proofed space (secured cabinets, latches and trash) matters. There is no licensed rabies vaccine for raccoons, and they can carry raccoon roundworm (Baylisascaris), which is dangerous to people, so strict hand and litter hygiene and regular deworming matter. They need a varied omnivore diet (not dog or cat food alone), an exotics vet, and lots of daily enrichment and attention; they're rarely bathed.",
  },
};
