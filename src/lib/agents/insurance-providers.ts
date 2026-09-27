import type { Species } from "@/lib/pets";

const DOGS_AND_CATS = ["dog", "cat"] as const;

// Curated allowlist of real pet insurance providers. URLs are hardcoded here,
// never model-generated -- a hallucinated link in a live demo is a real risk.
// Verified current as of the providers' own sites (not hardcoded from memory
// alone). `species` is what each provider actually insures: all of them cover
// dogs and cats; Nationwide's avian & exotic plan adds rabbits, birds, small
// mammals (hamsters, guinea pigs, rats, mice, chinchillas, ferrets, hedgehogs,
// sugar gliders, mini/pot-bellied pigs) and non-venomous reptiles and
// amphibians (checked Sep 27; petinsurance.com/exotics and
// todaysveterinarybusiness.com's report on the plan). ASPCA adds horses (in a
// limited set of states). Nobody here covers fish, crabs, raccoons or
// squirrels, chickens (Nationwide excludes flock birds) or axolotls
// (endangered species are excluded) -- those cards plan costs instead.
export const INSURANCE_PROVIDERS = {
  trupanion: { name: "Trupanion", url: "https://www.trupanion.com", species: DOGS_AND_CATS },
  healthy_paws: { name: "Healthy Paws", url: "https://www.healthypawspetinsurance.com", species: DOGS_AND_CATS },
  embrace: { name: "Embrace", url: "https://www.embracepetinsurance.com", species: DOGS_AND_CATS },
  figo: { name: "Figo", url: "https://www.figopetinsurance.com", species: DOGS_AND_CATS },
  aspca: {
    name: "ASPCA Pet Health Insurance",
    url: "https://www.aspcapetinsurance.com",
    species: ["dog", "cat", "horse"],
  },
  nationwide: {
    name: "Nationwide",
    url: "https://www.petinsurance.com",
    species: [
      "dog", "cat", "rabbit", "bird", "hamster", "guinea_pig", "rat", "mouse", "chinchilla",
      "ferret", "hedgehog", "sugar_glider", "pig", "lizard", "chameleon", "snake", "frog",
    ],
  },
} as const;

export type InsuranceProviderKey = keyof typeof INSURANCE_PROVIDERS;

// Vet-bill financing most US clinics accept, shown when one or no insurer
// covers the species. Hardcoded like the insurers: links are never generated.
export const VET_FINANCING = [
  { name: "CareCredit", url: "https://www.carecredit.com", note: "A health credit card many vets accept." },
  { name: "Scratchpay", url: "https://scratchpay.com", note: "Payment plans for vet bills." },
] as const;

// The providers that insure this species -- the only ones the insurance agent may pick.
export function providersFor(species: Species): InsuranceProviderKey[] {
  return (Object.keys(INSURANCE_PROVIDERS) as InsuranceProviderKey[]).filter((key) => {
    const covered: readonly Species[] = INSURANCE_PROVIDERS[key].species;
    return covered.includes(species);
  });
}
