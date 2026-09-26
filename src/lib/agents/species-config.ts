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
};
