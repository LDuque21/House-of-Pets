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

// A real product the owner can buy on Amazon. The card links each one to an
// Amazon search for product_name, so the name must be specific enough to find.
const PRODUCT_OPTION = {
  type: "object",
  properties: {
    product_name: {
      type: "string",
      description: "Brand plus product line as sold on Amazon, e.g. 'Virbac C.E.T. Enzymatic Toothpaste, Poultry Flavor'.",
    },
    price_range: PRICE_RANGE,
  },
  required: ["product_name", "price_range"],
};

export const DIET_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["diet"] },
    food_options: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          ...PRODUCT_OPTION.properties,
          package: { type: "string", description: "What the price buys, e.g. '15 lb bag' or '12 x 3 oz cans'." },
          note: { type: "string", description: "Why this option, in a few words." },
        },
        required: ["product_name", "package", "price_range", "note"],
      },
    },
    feeding_instructions: { type: "string" },
    cautions: { type: "array", items: { type: "string" }, maxItems: 2 },
  },
  required: ["category", "food_options", "feeding_instructions", "cautions"],
};

// Each hygiene routine carries the products it needs, so the card reads
// "Dental care: brush weekly -> Toothbrush: these 3 -> Toothpaste: these 3".
const ROUTINE = {
  type: "object",
  properties: {
    frequency_days: FREQUENCY_DAYS,
    notes: { type: "string" },
    products: {
      type: "array",
      maxItems: 2,
      description: "Products this routine needs. Empty if none (or if the routine isn't needed).",
      items: {
        type: "object",
        properties: {
          need: { type: "string", description: "What it's for, e.g. 'Toothpaste', 'Shampoo', 'Litter'." },
          options: { type: "array", minItems: 1, maxItems: 3, items: PRODUCT_OPTION },
        },
        required: ["need", "options"],
      },
    },
  },
  required: ["frequency_days", "notes", "products"],
};

export const HYGIENE_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["hygiene"] },
    bathing: ROUTINE,
    dental_care: ROUTINE,
    cleanup: {
      ...ROUTINE,
      description: "Litter box, cage, tank, or stall cleanup, or picking up waste for dogs.",
    },
  },
  required: ["category", "bathing", "dental_care", "cleanup"],
};

export const HEALTH_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["health"] },
    checkup_frequency_days: FREQUENCY_DAYS,
    vaccinations: { type: "array", items: { type: "string" }, maxItems: 3 },
    warning_signs: { type: "array", items: { type: "string" }, maxItems: 4 },
    screenings: {
      type: "array",
      maxItems: 3,
      description: "Age-based screenings recommended NOW, beyond the routine exam.",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Short, e.g. 'Senior blood panel'." },
          frequency_days: FREQUENCY_DAYS,
          why: { type: "string", description: "What it catches, one short sentence." },
        },
        required: ["name", "frequency_days", "why"],
      },
    },
    upcoming_milestones: {
      type: "array",
      maxItems: 2,
      description: "Screenings that start at a later age. Empty for seniors.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          starts: { type: "string", description: "When it starts, e.g. 'From age 7'." },
          why: { type: "string" },
        },
        required: ["name", "starts", "why"],
      },
    },
    condition_care: {
      type: "array",
      maxItems: 3,
      description: "One entry per known health condition. Empty if none were given.",
      items: {
        type: "object",
        properties: {
          condition: { type: "string" },
          what_to_do: { type: "string", description: "Day-to-day management, one or two short sentences." },
          vet_followup_days: FREQUENCY_DAYS,
          red_flags: { type: "string", description: "Signs this condition needs a vet urgently, one sentence." },
        },
        required: ["condition", "what_to_do", "vet_followup_days", "red_flags"],
      },
    },
  },
  required: [
    "category",
    "checkup_frequency_days",
    "vaccinations",
    "warning_signs",
    "screenings",
    "upcoming_milestones",
    "condition_care",
  ],
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
