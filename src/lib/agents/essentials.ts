import type { Species } from "@/lib/pets";

// Supplies every pet of a species must have, whatever the model says. The
// materials agent is told to include them (and price them); the card always
// shows them, plus any extra items the agent adds. `match` holds lowercase
// fragments used to recognize the agent's wording of the same item.
// `activity` marks time-based needs (play, company) -- nothing to shop for.
// `recommended` items are shown and priced like must-haves but labeled as
// good to have rather than essential. The owner can drop any of them through
// the card's Adjust box (materials `removed_essentials`).
export type Essential = { name: string; purpose: string; match: string[]; activity?: true; recommended?: true };

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
    { name: "Scratching post", purpose: "Healthy claws and furniture-free scratching.", match: ["scratch"], recommended: true },
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
  lizard: [
    { name: "Terrarium", purpose: "Sized for the species as an adult.", match: ["terrarium", "enclosure", "tank", "vivarium"] },
    { name: "Heat lamp and thermostat", purpose: "A safe temperature gradient.", match: ["heat", "thermostat"] },
    { name: "UVB light", purpose: "Needed by most day-active lizards for healthy bones.", match: ["uvb", "uv"] },
    { name: "Thermometer and hygrometer", purpose: "Tracks heat and humidity.", match: ["thermometer", "hygrometer"] },
    { name: "Hides", purpose: "A warm hide and a cool hide.", match: ["hide"] },
    { name: "Substrate", purpose: "Safe flooring for the species.", match: ["substrate", "bedding"] },
    { name: "Insects or greens", purpose: "Gut-loaded insects or fresh greens, as the species needs.", match: ["insect", "cricket", "worm", "roach", "greens", "lizard food"] },
    { name: "Calcium supplement", purpose: "Dusted on insects to prevent bone disease.", match: ["calcium", "supplement", "dust"] },
    { name: "Water dish", purpose: "Fresh water, shallow enough to climb out of.", match: ["water", "dish"] },
  ],
  chameleon: [
    { name: "Screen enclosure", purpose: "Tall and well ventilated; glass tanks trap stale air.", match: ["screen", "enclosure", "cage"] },
    { name: "Live plants and branches", purpose: "Climbing, hiding and humidity.", match: ["plant", "branch", "vine"] },
    { name: "UVB light", purpose: "Essential for healthy bones.", match: ["uvb", "uv"] },
    { name: "Basking lamp", purpose: "A warm spot at the top of the enclosure.", match: ["basking", "heat", "lamp"] },
    { name: "Mister or dripper", purpose: "Chameleons only drink moving droplets.", match: ["mist", "dripper", "drip", "fogger"] },
    { name: "Live feeder insects", purpose: "Gut-loaded crickets, roaches or worms.", match: ["insect", "cricket", "roach", "worm"] },
    { name: "Calcium supplement", purpose: "Dusted on insects to prevent bone disease.", match: ["calcium", "supplement", "dust"] },
    { name: "Thermometer and hygrometer", purpose: "Tracks heat and humidity.", match: ["thermometer", "hygrometer"] },
  ],
  snake: [
    { name: "Locking enclosure", purpose: "Snakes are escape artists.", match: ["enclosure", "tank", "vivarium", "terrarium", "lock"] },
    { name: "Heat mat and thermostat", purpose: "A safe warm side, never too hot.", match: ["heat", "thermostat", "mat"] },
    { name: "Two hides", purpose: "One on the warm side, one on the cool side.", match: ["hide"] },
    { name: "Substrate", purpose: "Holds humidity for healthy sheds.", match: ["substrate", "bedding", "aspen", "coco"] },
    { name: "Frozen-thawed rodents", purpose: "Sized to the snake's girth.", match: ["rodent", "mice", "mouse", "rat", "frozen"] },
    { name: "Water bowl", purpose: "Big enough to soak in.", match: ["water", "bowl", "dish"] },
    { name: "Thermometer and hygrometer", purpose: "Tracks heat and humidity.", match: ["thermometer", "hygrometer"] },
  ],
  frog: [
    { name: "Terrarium or tank", purpose: "Sized and set up for the species (land, tree or water).", match: ["terrarium", "tank", "enclosure", "vivarium"] },
    { name: "Water conditioner", purpose: "Frogs absorb chlorine through their skin.", match: ["conditioner", "dechlorinator"] },
    { name: "Moist substrate", purpose: "Coco fiber or moss that holds humidity.", match: ["substrate", "coco", "moss"] },
    { name: "Mister", purpose: "Keeps humidity high.", match: ["mist", "spray", "fogger"] },
    { name: "Live feeder insects", purpose: "Gut-loaded crickets or worms.", match: ["insect", "cricket", "worm", "roach"] },
    { name: "Calcium supplement", purpose: "Dusted on insects to prevent bone disease.", match: ["calcium", "supplement", "dust"] },
    { name: "Hides and plants", purpose: "Cover to feel safe.", match: ["hide", "plant", "cork"] },
  ],
  axolotl: [
    { name: "20+ gallon tank", purpose: "Long rather than tall; axolotls walk the bottom.", match: ["tank", "aquarium"] },
    { name: "Gentle filter", purpose: "Clean water without strong current.", match: ["filter"] },
    { name: "Chiller or fan", purpose: "Keeps water at about 60-64°F.", match: ["chiller", "fan", "cool"] },
    { name: "Water conditioner", purpose: "Makes tap water safe.", match: ["conditioner", "dechlorinator"] },
    { name: "Water test kit", purpose: "Checks ammonia, nitrite and nitrate.", match: ["test kit", "test"] },
    { name: "Fine sand or bare bottom", purpose: "Gravel gets swallowed.", match: ["sand", "bare", "substrate"] },
    { name: "Earthworms or axolotl pellets", purpose: "A complete diet.", match: ["worm", "pellet", "axolotl food"] },
    { name: "Hides", purpose: "Shade from light.", match: ["hide", "cave"] },
  ],
  crab: [
    { name: "Glass tank with lid", purpose: "Holds humidity and heat.", match: ["tank", "terrarium", "enclosure"] },
    { name: "Deep substrate", purpose: "Sand and coco fiber to bury in while molting.", match: ["substrate", "sand", "coco"] },
    { name: "Spare shells", purpose: "A size up, so hermit crabs can move house.", match: ["shell"] },
    { name: "Fresh and saltwater pools", purpose: "Dechlorinated water and marine salt.", match: ["pool", "dish", "water", "marine salt", "salt"] },
    { name: "Heat mat and thermostat", purpose: "Keeps the tank at 75-85°F.", match: ["heat", "thermostat", "mat"] },
    { name: "Hygrometer", purpose: "Humidity must stay at 70-80%.", match: ["hygrometer", "humidity", "gauge"] },
    { name: "Crab food", purpose: "Commercial crab food plus fresh foods.", match: ["crab food", "food"] },
    { name: "Climbing decor", purpose: "Crabs love to climb.", match: ["climb", "decor", "cholla", "wood"] },
  ],
  pig: [
    { name: "Mini pig pellets", purpose: "Low-calorie pig food, portioned daily.", match: ["pellet", "pig food", "feed"] },
    { name: "Fresh vegetables", purpose: "Most of their treats and variety.", match: ["vegetable", "veggie", "greens"] },
    { name: "Heavy water bowl", purpose: "Pigs tip over light bowls.", match: ["water", "bowl"] },
    { name: "Bed and blankets", purpose: "Pigs love to burrow under blankets.", match: ["bed", "blanket"] },
    { name: "Rooting box or yard space", purpose: "Rooting is a natural need.", match: ["root", "yard", "outdoor"] },
    { name: "Harness", purpose: "Safe walks outside.", match: ["harness", "leash"] },
    { name: "Hoof trimmers", purpose: "Regular hoof care.", match: ["hoof", "trimmer"] },
    { name: "Litter box", purpose: "Pigs can be litter trained.", match: ["litter"] },
  ],
  ferret: [
    { name: "Multi-level cage", purpose: "For sleeping; ferrets need hours out daily.", match: ["cage", "enclosure"] },
    { name: "High-protein ferret food", purpose: "Meat-based; no fruit, sugar or grains.", match: ["ferret food", "kibble", "food"] },
    { name: "Hammocks and sleep sacks", purpose: "Ferrets sleep 14+ hours a day.", match: ["hammock", "sleep sack", "bed"] },
    { name: "Litter box", purpose: "Corner-style, in the cage and play area.", match: ["litter"] },
    { name: "Water bottle or bowl", purpose: "Fresh water at all times.", match: ["water", "bottle", "bowl"] },
    { name: "Tunnels and toys", purpose: "Hard toys only; soft rubber gets swallowed.", match: ["tunnel", "toy"] },
    { name: "Nail clippers", purpose: "Weekly nail trims.", match: ["nail", "clipper"] },
    { name: "Daily supervised play", purpose: "Several hours out of the cage every day.", match: ["play", "exercise", "out-of-cage"], activity: true },
  ],
  squirrel: [
    { name: "Large tall cage or aviary", purpose: "Room to climb and jump.", match: ["cage", "aviary", "enclosure"] },
    { name: "Nest box", purpose: "A dark, cozy place to sleep.", match: ["nest"] },
    { name: "Rodent blocks", purpose: "A balanced base diet.", match: ["block", "rodent", "pellet"] },
    { name: "Nuts, vegetables and fruit", purpose: "Variety in small amounts.", match: ["nut", "vegetable", "fruit"] },
    { name: "Calcium source", purpose: "Prevents bone disease on nut-heavy diets.", match: ["calcium", "supplement"] },
    { name: "Branches and chew items", purpose: "Climbing and ever-growing teeth.", match: ["branch", "chew", "wood"] },
    { name: "Water bottle", purpose: "Fresh water at all times.", match: ["water", "bottle"] },
    { name: "Daily exercise out of the cage", purpose: "Squirrels need lots of activity.", match: ["exercise", "play", "out-of-cage"], activity: true },
  ],
  sugar_glider: [
    { name: "Tall cage", purpose: "Height for climbing and gliding.", match: ["cage", "enclosure"] },
    { name: "Sleeping pouch", purpose: "Gliders sleep curled up together in a pouch.", match: ["pouch", "nest"] },
    { name: "Staple glider diet", purpose: "A balanced base diet, with calcium.", match: ["glider diet", "diet", "food"] },
    { name: "Feeder insects", purpose: "Protein, like mealworms.", match: ["insect", "mealworm", "cricket"] },
    { name: "Glider-safe wheel", purpose: "Enclosed, so tails don't get caught.", match: ["wheel"] },
    { name: "Water bottle", purpose: "Fresh water at all times.", match: ["water", "bottle"] },
    { name: "A companion glider", purpose: "Gliders get lonely and ill alone.", match: ["companion", "pair", "second glider"], activity: true },
  ],
  hedgehog: [
    { name: "Large enclosure", purpose: "Plenty of floor space to roam.", match: ["enclosure", "cage"] },
    { name: "Solid wheel", purpose: "Nightly exercise without foot injuries.", match: ["wheel"] },
    { name: "Heat source and thermostat", purpose: "Keeps them at 72-80°F; cold can be fatal.", match: ["heat", "thermostat", "ceramic"] },
    { name: "Hedgehog food", purpose: "Or a high-quality cat food, plus insects.", match: ["hedgehog food", "cat food", "food"] },
    { name: "Hide", purpose: "A dark place to sleep.", match: ["hide", "igloo"] },
    { name: "Paper or fleece bedding", purpose: "Soft and dust-free.", match: ["bedding", "fleece", "liner"] },
    { name: "Water bowl", purpose: "Fresh water at all times.", match: ["water", "bowl", "bottle"] },
  ],
  mouse: [
    { name: "Well-ventilated cage", purpose: "Room to climb; bar spacing mice can't squeeze through.", match: ["cage", "enclosure", "tank"] },
    { name: "Lab blocks", purpose: "A complete mouse diet.", match: ["lab block", "block", "mouse food", "pellet"] },
    { name: "Deep paper bedding", purpose: "For burrowing and nesting.", match: ["bedding"] },
    { name: "Solid wheel", purpose: "Exercise without foot injuries.", match: ["wheel"] },
    { name: "Water bottle", purpose: "Fresh water at all times.", match: ["water", "bottle"] },
    { name: "Hides and nesting material", purpose: "Safe places to sleep.", match: ["hide", "nest"] },
    { name: "Chew toys", purpose: "Wears down ever-growing teeth.", match: ["chew", "toy"] },
  ],
  chicken: [
    { name: "Predator-proof coop", purpose: "With roosting bars and nest boxes.", match: ["coop"] },
    { name: "Secure run", purpose: "Outdoor space safe from predators.", match: ["run", "fence"] },
    { name: "Layer feed", purpose: "Complete feed for laying hens.", match: ["layer", "feed"] },
    { name: "Oyster shell and grit", purpose: "Calcium for eggshells; grit for digestion.", match: ["oyster", "grit", "calcium"] },
    { name: "Waterer", purpose: "Clean water, kept from freezing in winter.", match: ["waterer", "water"] },
    { name: "Feeder", purpose: "Keeps feed dry and clean.", match: ["feeder"] },
    { name: "Coop bedding", purpose: "Pine shavings or straw.", match: ["bedding", "shavings", "straw"] },
    { name: "Dust bath area", purpose: "How chickens keep mites and lice away.", match: ["dust"] },
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
    { name: "Secure space", purpose: "An enclosure or a raccoon-proofed room; raccoons open latches and cabinets.", match: ["enclosure", "cage", "pen", "raccoon-proof", "secure space"] },
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
