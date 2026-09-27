import type { Species } from "@/lib/pets";

const DOGS_AND_CATS = ["dog", "cat"] as const;

// Curated allowlist of real pet insurance providers. URLs are hardcoded here,
// never model-generated -- a hallucinated link in a live demo is a real risk.
// Verified current as of the providers' own sites (not hardcoded from memory
// alone). `species` is what each provider actually insures: all of them cover
// dogs and cats; Nationwide's avian & exotic plan adds rabbits, birds,
// reptiles, hamsters, guinea pigs, rats and chinchillas (checked Sep 27 on
// petinsurance.com/exotics); ASPCA adds horses (in a limited set of states).
// No provider here covers fish or raccoons (Nationwide excludes species that
// need a permit or are illegal to own) -- the orchestrator skips the
// insurance agent then.
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
    species: ["dog", "cat", "rabbit", "bird", "reptile", "hamster", "guinea_pig", "rat", "chinchilla"],
  },
} as const;

export type InsuranceProviderKey = keyof typeof INSURANCE_PROVIDERS;

// The providers that insure this species -- the only ones the insurance agent may pick.
export function providersFor(species: Species): InsuranceProviderKey[] {
  return (Object.keys(INSURANCE_PROVIDERS) as InsuranceProviderKey[]).filter((key) => {
    const covered: readonly Species[] = INSURANCE_PROVIDERS[key].species;
    return covered.includes(species);
  });
}
