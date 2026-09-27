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
  lizard: {
    context:
      "Pet lizards (leopard geckos, bearded dragons, crested geckos, blue-tongued skinks, iguanas) are ectotherms: they depend on a warm-to-cool temperature gradient, UVB lighting for most day-active species, and the right humidity. Insect-eaters need gut-loaded insects dusted with calcium (and D3 where there's no UVB); iguanas and adult bearded dragons eat mostly greens. Metabolic bone disease is the classic husbandry illness. They aren't bathed like mammals, though some benefit from shallow soaks, and they need an exotics vet.",
  },
  chameleon: {
    context:
      "Chameleons (veiled, panther) are among the hardest lizards to keep: a tall, well-ventilated screen enclosure with live plants, strong UVB, a basking spot and a daily misting or dripper system, since they only drink moving droplets, never from a bowl. They eat gut-loaded live insects dusted with calcium. They stress easily and are not for regular handling. Metabolic bone disease, dehydration and eye problems are common. They need an exotics vet.",
  },
  snake: {
    context:
      "Pet snakes (corn snakes, ball pythons, kingsnakes) need a secure, locking enclosure (they are escape artists), a heat gradient with a thermostat, hides on both the warm and cool sides, and humidity suited to the species for clean sheds. Most eat appropriately sized frozen-thawed rodents every 1-2 weeks as adults. Watch for retained shed, mites, respiratory infections and refusing food. They aren't bathed, and they need an exotics vet.",
  },
  frog: {
    context:
      "Pet frogs (Pacman frogs, White's tree frogs, African dwarf frogs, dart frogs) absorb water and chemicals through their skin: use dechlorinated water only, keep humidity high, and handle rarely, with clean wet hands and no lotions. Land frogs eat gut-loaded insects dusted with calcium; fully aquatic species need a filtered tank. Temperature and UVB needs vary by species. They're never bathed and need an exotics vet.",
  },
  axolotl: {
    context:
      "Axolotls are fully aquatic salamanders that need COLD water (about 60-64°F; above 70°F is dangerous, so a chiller or fan may be needed, never a heater), a cycled tank of 20+ gallons with a gentle filter, dechlorinated water and bare-bottom or fine sand (they swallow gravel). They eat earthworms and axolotl pellets. They have delicate skin and should rarely be handled. They're never bathed and need an exotics vet familiar with amphibians.",
  },
  crab: {
    context:
      "Most pet crabs are land hermit crabs, which live in groups and need a humid (70-80%) warm (75-85°F) tank with deep substrate to bury in while molting, spare shells a size up, and both fresh and saltwater pools made with dechlorinated water and marine salt. Aquatic crabs (fiddler, red claw) need brackish water plus a land area. Crabs aren't bathed. Never handle a molting crab, and use crab-safe foods and decor (no metal or painted shells).",
  },
  pig: {
    context:
      "Pet pigs (mini and pot-bellied pigs) are smart, social herbivore-omnivores that grow much larger than 'mini' suggests. They need a low-calorie pig pellet diet with vegetables (obesity is the most common problem), outdoor rooting space, enrichment, regular hoof trims, and tusk trims for boars. They need a vet who sees pigs. Occasional baths and skin moisturizing help their dry skin.",
  },
  ferret: {
    context:
      "Ferrets are obligate carnivores that need a high-protein, meat-based ferret food and no fruit, sugar or grains. They sleep 14+ hours a day but need hours of supervised play in a ferret-proofed room. They need canine distemper and rabies vaccines. Adrenal disease, insulinoma and swallowed foreign objects are common. Baths are needed only rarely (they strip skin oils); weekly nail trims and ear cleaning are part of routine care.",
  },
  squirrel: {
    context:
      "Pet squirrels are active, chewing climbers. They need a very large, tall cage or aviary with branches and a nest box, daily out-of-cage exercise, and a rodent-block base diet with some nuts, vegetables and fruit. Calcium deficiency (metabolic bone disease) is a common risk on nut-heavy diets. They need constant chewing material for ever-growing teeth and an exotics vet. They're rarely bathed.",
  },
  sugar_glider: {
    context:
      "Sugar gliders are small nocturnal marsupials that must live in pairs or groups (loneliness makes them ill). They need a tall cage for climbing and gliding, a pouch to sleep in, and a specialized diet (a staple glider diet plus insects and some fruit and vegetables) balanced for calcium, since metabolic bone disease is common. They need an exotics vet and aren't bathed.",
  },
  hedgehog: {
    context:
      "African pygmy hedgehogs are solitary, nocturnal insectivores. Keep them at 72-80°F: colder, they can attempt hibernation, which can be fatal. They need a large enclosure, a solid wheel (and wheel cleaning), a hide, and a high-quality hedgehog or cat food plus insects. Obesity, mites, dental disease and wobbly hedgehog syndrome are concerns. Occasional foot baths clean poop from their feet. They need an exotics vet.",
  },
  mouse: {
    context:
      "Pet (fancy) mice are social: females live best in groups, while males usually must live alone. They need a large, well-ventilated cage with deep paper bedding, a solid wheel, and a lab-block diet with small amounts of fresh food. They live about 1.5-3 years, so they're seniors from around age 1.5; tumors and respiratory infections are common. They groom themselves and are rarely bathed. They need an exotics vet.",
  },
  chicken: {
    context:
      "Backyard chickens are flock animals (keep at least 3) that need a secure, predator-proof coop with roosting bars, nest boxes and a run, layer feed with oyster shell for laying hens, grit, fresh water, and a dust-bathing spot. Watch for mites, lice, bumblefoot, egg binding and respiratory disease. They're rarely bathed and need a vet who sees poultry.",
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
