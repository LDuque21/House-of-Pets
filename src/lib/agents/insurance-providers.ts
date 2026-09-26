// Curated allowlist of real pet insurance providers. URLs are hardcoded here,
// never model-generated -- a hallucinated link in a live demo is a real risk.
// Verified current as of the providers' own sites (not hardcoded from memory
// alone). Not all providers cover exotics (rabbits); the prompt is told this.
export const INSURANCE_PROVIDERS = {
  trupanion: { name: "Trupanion", url: "https://www.trupanion.com" },
  healthy_paws: { name: "Healthy Paws", url: "https://www.healthypawspetinsurance.com" },
  embrace: { name: "Embrace", url: "https://www.embracepetinsurance.com" },
  figo: { name: "Figo", url: "https://www.figopetinsurance.com" },
  aspca: { name: "ASPCA Pet Health Insurance", url: "https://www.aspcapetinsurance.com" },
  nationwide: { name: "Nationwide", url: "https://www.petinsurance.com" },
} as const;

export type InsuranceProviderKey = keyof typeof INSURANCE_PROVIDERS;
