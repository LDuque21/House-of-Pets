import type { Species } from "@/lib/pets";
import { providersFor } from "@/lib/agents/insurance-providers";

const PRICE_RANGE = {
  type: "object",
  properties: {
    low: { type: "number" },
    high: { type: "number" },
    currency: { type: "string", enum: ["USD"] },
  },
  required: ["low", "high", "currency"],
};

// Frequencies become tasks.frequency_days, an INTEGER column, so they must be
// whole days -- a fractional answer like 0.5 for "twice a day" fails the insert.
const FREQUENCY_DAYS = {
  type: "integer",
  description: "Whole days between occurrences: 1 means daily or more often, 0 means not routinely needed.",
};

export const DIET_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["diet"] },
    primary_food: {
      type: "object",
      properties: {
        name: { type: "string" },
        brand_examples: { type: "array", items: { type: "string" }, maxItems: 3 },
        price_range: PRICE_RANGE,
      },
      required: ["name", "brand_examples", "price_range"],
    },
    feeding_instructions: { type: "string" },
    cautions: { type: "array", items: { type: "string" }, maxItems: 2 },
  },
  required: ["category", "primary_food", "feeding_instructions", "cautions"],
};

export const HYGIENE_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["hygiene"] },
    bathing: {
      type: "object",
      properties: { frequency_days: FREQUENCY_DAYS, notes: { type: "string" } },
      required: ["frequency_days", "notes"],
    },
    dental_care: {
      type: "object",
      properties: {
        frequency_days: FREQUENCY_DAYS,
        dental_treats: { type: "array", items: { type: "string" }, maxItems: 2 },
        notes: { type: "string" },
      },
      required: ["frequency_days", "dental_treats", "notes"],
    },
    cleanup: {
      type: "object",
      description: "Litter box, cage, tank, or stall cleanup, or picking up waste for dogs.",
      properties: { frequency_days: FREQUENCY_DAYS, notes: { type: "string" } },
      required: ["frequency_days", "notes"],
    },
    supplies: { type: "array", items: { type: "string" }, maxItems: 4 },
  },
  required: ["category", "bathing", "dental_care", "cleanup", "supplies"],
};

export const HEALTH_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["health"] },
    checkup_frequency_days: FREQUENCY_DAYS,
    vaccinations: { type: "array", items: { type: "string" }, maxItems: 3 },
    warning_signs: { type: "array", items: { type: "string" }, maxItems: 4 },
  },
  required: ["category", "checkup_frequency_days", "vaccinations", "warning_signs"],
};

// The provider enum is narrowed to insurers that cover the pet's species, so
// the model can't recommend a company that won't insure it. Rabbits have only
// one such provider, which is why the counts shrink to fit the list.
export function insuranceSchema(species: Species) {
  const providers = providersFor(species);
  return {
    type: "object",
    properties: {
      category: { type: "string", enum: ["insurance"] },
      providers: {
        type: "array",
        minItems: Math.min(3, providers.length),
        maxItems: Math.min(5, providers.length),
        items: {
          type: "object",
          properties: {
            provider_key: { type: "string", enum: providers },
            estimated_monthly_range: PRICE_RANGE,
            notes: { type: "string" },
          },
          required: ["provider_key", "estimated_monthly_range", "notes"],
        },
      },
    },
    required: ["category", "providers"],
  };
}

export const MATERIALS_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["materials"] },
    items: {
      type: "array",
      minItems: 5,
      maxItems: 12,
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          purpose: { type: "string" },
          price_range: PRICE_RANGE,
        },
        required: ["name", "purpose", "price_range"],
      },
    },
  },
  required: ["category", "items"],
};

// A category's schema is either fixed or built per species (insurance).
export const CATEGORY_SCHEMAS = {
  diet: DIET_SCHEMA,
  hygiene: HYGIENE_SCHEMA,
  health: HEALTH_SCHEMA,
  insurance: insuranceSchema,
  materials: MATERIALS_SCHEMA,
} as const;

export type Category = keyof typeof CATEGORY_SCHEMAS;

export function schemaFor(category: Category, species: Species): { required: string[] } {
  const schema = CATEGORY_SCHEMAS[category];
  return typeof schema === "function" ? schema(species) : schema;
}
