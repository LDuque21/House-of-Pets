import type { Species } from "@/lib/pets";

// Supplies every pet of a species must have, whatever the model says. The
// materials agent is told to include them (and price them); the card always
// shows them, plus any extra items the agent adds. `match` holds lowercase
// fragments used to recognize the agent's wording of the same item.
// `activity` marks time-based needs (play, company) -- nothing to shop for.
export type Essential = { name: string; purpose: string; match: string[]; activity?: true };

export const ESSENTIALS: Record<Species, Essential[]> = {
  dog: [
    { name: "Dog food", purpose: "Complete food sized for age and breed.", match: ["dog food", "kibble", "wet food", "dry food"] },
    { name: "Food and water bowls", purpose: "Fresh water available all day.", match: ["bowl"] },
    { name: "Collar, ID tag and leash", purpose: "Safe walks and a way home if lost.", match: ["collar", "leash", "harness", "tag"] },
    { name: "Bed or crate", purpose: "A quiet place of their own to rest.", match: ["bed", "crate"] },
    { name: "Chew toys", purpose: "Healthy chewing and boredom relief.", match: ["toy", "chew"] },
    { name: "Waste bags", purpose: "Cleaning up on walks.", match: ["waste bag", "poop bag", "bags"] },
    { name: "Daily walks and play", purpose: "Exercise and quality time together, every day.", match: ["walk", "play", "quality time"], activity: true },
  ],
  cat: [
    { name: "Litter box and litter", purpose: "One box per cat, plus one extra.", match: ["litter"] },
    { name: "Cat food", purpose: "Complete, taurine-rich food.", match: ["cat food", "kibble", "wet food", "dry food"] },
    { name: "Food and water bowls", purpose: "Fresh water every day (a fountain helps).", match: ["bowl", "fountain"] },
    { name: "Scratching post", purpose: "Healthy claws and furniture-free scratching.", match: ["scratch"] },
    { name: "Toys", purpose: "Wands and balls for hunting play.", match: ["toy", "wand"] },
    { name: "Bed or hiding spot", purpose: "A cozy, safe place to retreat.", match: ["bed", "hide", "hiding"] },
    { name: "Carrier", purpose: "Safe trips to the vet.", match: ["carrier"] },
    { name: "Daily play and quality time", purpose: "Company and play keep cats happy and active.", match: ["play", "quality time", "enrichment"], activity: true },
  ],
  rabbit: [
    { name: "Large pen or enclosure", purpose: "Room to hop, stretch and stand up.", match: ["pen", "enclosure", "cage", "hutch"] },
    { name: "Unlimited hay", purpose: "Most of their diet; keeps teeth and gut healthy.", match: ["hay"] },
    { name: "Rabbit pellets", purpose: "A measured daily portion.", match: ["pellet"] },
    { name: "Water bowl or bottle", purpose: "Fresh water at all times.", match: ["water"] },
    { name: "Litter box and paper litter", purpose: "Rabbits can be litter trained.", match: ["litter"] },
    { name: "Chew toys", purpose: "Wears down ever-growing teeth.", match: ["chew", "toy"] },
    { name: "Hide box", purpose: "A safe place to retreat.", match: ["hide", "hideout"] },
    { name: "Daily exercise and company", purpose: "Time out of the pen with you.", match: ["exercise", "play", "company"], activity: true },
  ],
  fish: [
    { name: "Aquarium", purpose: "Sized for the species and how many fish.", match: ["aquarium", "tank"] },
    { name: "Filter", purpose: "Keeps water clean and oxygenated.", match: ["filter"] },
    { name: "Heater and thermometer", purpose: "Steady water temperature.", match: ["heater", "thermometer"] },
    { name: "Water conditioner", purpose: "Makes tap water safe.", match: ["conditioner", "dechlorinator"] },
    { name: "Water test kit", purpose: "Checks ammonia, nitrite and pH.", match: ["test kit", "test"] },
    { name: "Fish food", purpose: "Species-appropriate flakes or pellets.", match: ["fish food", "flake"] },
    { name: "Gravel vacuum", purpose: "Easy partial water changes.", match: ["vacuum", "siphon"] },
  ],
  bird: [
    { name: "Spacious cage", purpose: "Room to spread wings and climb.", match: ["cage"] },
    { name: "Varied perches", purpose: "Different widths keep feet healthy.", match: ["perch"] },
    { name: "Pellet food and fresh vegetables", purpose: "A balanced daily diet.", match: ["pellet", "seed", "bird food"] },
    { name: "Food and water dishes", purpose: "Fresh water every day.", match: ["dish", "bowl", "water"] },
    { name: "Chew and foraging toys", purpose: "Mental stimulation and beak health.", match: ["toy", "forag"] },
    { name: "Cage liners", purpose: "Quick, clean cage changes.", match: ["liner", "paper"] },
    { name: "Travel carrier", purpose: "Safe trips to the avian vet.", match: ["carrier"] },
    { name: "Daily out-of-cage time", purpose: "Social time and exercise with you.", match: ["out-of-cage", "social", "play"], activity: true },
  ],
  horse: [
    { name: "Hay or pasture", purpose: "Near-constant forage.", match: ["hay", "pasture", "forage"] },
    { name: "Fresh water trough", purpose: "Clean water at all times.", match: ["water", "trough", "bucket"] },
    { name: "Shelter or stall", purpose: "Protection from weather.", match: ["shelter", "stall", "barn"] },
    { name: "Halter and lead rope", purpose: "Safe handling.", match: ["halter", "lead"] },
    { name: "Grooming kit", purpose: "Daily brushing and checks.", match: ["groom", "brush", "curry"] },
    { name: "Hoof pick", purpose: "Daily hoof cleaning.", match: ["hoof"] },
    { name: "Salt or mineral block", purpose: "Essential minerals.", match: ["salt", "mineral"] },
    { name: "Fly spray or fly mask", purpose: "Comfort in warm months.", match: ["fly"] },
  ],
  reptile: [
    { name: "Terrarium", purpose: "Sized for the species as an adult.", match: ["terrarium", "enclosure", "tank", "vivarium"] },
    { name: "Heat lamp and thermostat", purpose: "A safe temperature gradient.", match: ["heat", "thermostat"] },
    { name: "UVB light", purpose: "Needed by many species for healthy bones.", match: ["uvb", "uv"] },
    { name: "Thermometer and hygrometer", purpose: "Tracks heat and humidity.", match: ["thermometer", "hygrometer"] },
    { name: "Hides", purpose: "A warm hide and a cool hide.", match: ["hide"] },
    { name: "Substrate", purpose: "Safe flooring for the species.", match: ["substrate", "bedding"] },
    { name: "Species-appropriate food", purpose: "Insects, rodents or greens, as the species needs.", match: ["reptile food", "insect", "cricket", "worm", "greens", "rodent"] },
    { name: "Water dish", purpose: "Fresh water, big enough to soak in.", match: ["water", "dish"] },
  ],
  hamster: [
    { name: "Large enclosure", purpose: "Plenty of floor space.", match: ["enclosure", "cage", "tank"] },
    { name: "Deep bedding", purpose: "For burrowing, a natural need.", match: ["bedding"] },
    { name: "Solid-surface wheel", purpose: "Nightly exercise without foot injuries.", match: ["wheel"] },
    { name: "Hamster food mix", purpose: "Pellets plus small amounts of fresh food.", match: ["hamster food", "food mix", "pellet"] },
    { name: "Water bottle", purpose: "Fresh water at all times.", match: ["water", "bottle"] },
    { name: "Chew toys", purpose: "Wears down ever-growing teeth.", match: ["chew", "toy"] },
    { name: "Hide house", purpose: "A safe place to sleep.", match: ["hide", "house"] },
    { name: "Sand bath", purpose: "Hamsters clean themselves in sand, never water.", match: ["sand"] },
  ],
  guinea_pig: [
    { name: "Large cage", purpose: "At least 7.5 sq ft for a pair.", match: ["cage", "enclosure", "pen"] },
    { name: "Unlimited hay", purpose: "Most of their diet; keeps teeth and gut healthy.", match: ["hay"] },
    { name: "Guinea pig pellets", purpose: "Vitamin C-fortified daily portion.", match: ["pellet"] },
    { name: "Fresh vegetables", purpose: "Daily vitamin C (bell pepper, leafy greens).", match: ["vegetable", "veggie", "greens"] },
    { name: "Water bottle", purpose: "Fresh water at all times.", match: ["water", "bottle"] },
    { name: "Fleece or paper bedding", purpose: "Soft, absorbent flooring.", match: ["bedding", "fleece"] },
    { name: "Hides", purpose: "One hide per guinea pig.", match: ["hide", "hideout"] },
    { name: "Daily company", purpose: "A cage mate and time with you every day.", match: ["company", "social", "floor time"], activity: true },
  ],
  rat: [
    { name: "Multi-level cage", purpose: "Tall, with shelves and ramps to climb.", match: ["cage", "enclosure"] },
    { name: "Lab blocks", purpose: "A complete rat diet (e.g. Oxbow or Mazuri).", match: ["lab block", "rat food", "block", "pellet"] },
    { name: "Water bottle", purpose: "Fresh water at all times.", match: ["water", "bottle"] },
    { name: "Paper bedding", purpose: "Dust-free, kind to sensitive lungs.", match: ["bedding"] },
    { name: "Hammocks and hides", purpose: "Places to nap and feel safe.", match: ["hammock", "hide"] },
    { name: "Chew toys", purpose: "Wears down ever-growing teeth.", match: ["chew", "toy"] },
    { name: "Daily out-of-cage time", purpose: "Rats need play and company every day.", match: ["out-of-cage", "play", "company"], activity: true },
  ],
  chinchilla: [
    { name: "Tall multi-level cage", purpose: "Room to jump between ledges.", match: ["cage", "enclosure"] },
    { name: "Unlimited hay", purpose: "Most of their diet; keeps teeth and gut healthy.", match: ["hay"] },
    { name: "Chinchilla pellets", purpose: "Plain pellets, no seeds or treats mixed in.", match: ["pellet", "chinchilla food"] },
    { name: "Dust bath and chinchilla dust", purpose: "How they keep their fur clean; never water.", match: ["dust"] },
    { name: "Water bottle", purpose: "Fresh water at all times.", match: ["water", "bottle"] },
    { name: "Chew blocks", purpose: "Wears down ever-growing teeth.", match: ["chew", "block"] },
    { name: "Solid-surface wheel", purpose: "Nightly exercise without foot injuries.", match: ["wheel"] },
    { name: "Cool room", purpose: "Keep them below about 75°F; they overheat easily.", match: ["cool", "fan", "cooling", "temperature"], activity: true },
  ],
  raccoon: [
    { name: "Large secure enclosure", purpose: "Escape-proof, with climbing space; raccoons open latches.", match: ["enclosure", "cage", "pen"] },
    { name: "Varied omnivore diet", purpose: "Protein, fruit, vegetables and a quality base food.", match: ["food", "diet"] },
    { name: "Water tub", purpose: "For drinking and the food-washing they love.", match: ["water", "tub", "pool"] },
    { name: "Den box", purpose: "A dark, cozy place to sleep.", match: ["den", "nest", "hide"] },
    { name: "Puzzle and foraging toys", purpose: "Essential enrichment for a clever animal.", match: ["puzzle", "forag", "toy"] },
    { name: "Enclosure disinfectant", purpose: "Protects people from raccoon roundworm.", match: ["disinfect", "cleaner"] },
    { name: "Hours of daily enrichment", purpose: "Raccoons need a lot of activity and attention.", match: ["enrichment", "play", "attention"], activity: true },
  ],
};

// Pairs each of the agent's items with at most one essential (and vice versa),
// preferring the longest matching fragment so "food bowl" isn't taken as food.
export function matchEssentials(species: Species, itemNames: string[]): Map<number, Essential> {
  const matched = new Map<number, Essential>();
  const claimed = new Set<Essential>();
  itemNames.forEach((itemName, index) => {
    const name = itemName.toLowerCase();
    let best: { essential: Essential; length: number } | undefined;
    for (const essential of ESSENTIALS[species]) {
      if (claimed.has(essential)) continue;
      for (const fragment of essential.match) {
        if (name.includes(fragment) && fragment.length > (best?.length ?? 0)) best = { essential, length: fragment.length };
      }
    }
    if (best) {
      matched.set(index, best.essential);
      claimed.add(best.essential);
    }
  });
  return matched;
}
