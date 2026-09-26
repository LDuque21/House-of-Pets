import { INSURANCE_PROVIDERS } from "@/lib/agents/insurance-providers";

const PRICE_RANGE = {
  type: "object",
  properties: {
    low: { type: "number" },
    high: { type: "number" },
    currency: { type: "string", enum: ["USD"] },
  },
  required: ["low", "high", "currency"],
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
      properties: { frequency_days: { type: "number" }, notes: { type: "string" } },
      required: ["frequency_days", "notes"],
    },
    dental_care: {
      type: "object",
      properties: {
        frequency_days: { type: "number" },
        dental_treats: { type: "array", items: { type: "string" }, maxItems: 2 },
        notes: { type: "string" },
      },
      required: ["frequency_days", "dental_treats", "notes"],
    },
    cleanup: {
      type: "object",
      description: "Litter box cleanup for cats/rabbits, or general waste cleanup for dogs.",
      properties: { frequency_days: { type: "number" }, notes: { type: "string" } },
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
    checkup_frequency_days: { type: "number" },
    vaccinations: { type: "array", items: { type: "string" }, maxItems: 3 },
    warning_signs: { type: "array", items: { type: "string" }, maxItems: 4 },
  },
  required: ["category", "checkup_frequency_days", "vaccinations", "warning_signs"],
};

export const INSURANCE_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["insurance"] },
    providers: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          provider_key: { type: "string", enum: Object.keys(INSURANCE_PROVIDERS) },
          estimated_monthly_range: PRICE_RANGE,
          notes: { type: "string" },
        },
        required: ["provider_key", "estimated_monthly_range", "notes"],
      },
    },
  },
  required: ["category", "providers"],
};

export const MATERIALS_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["materials"] },
    items: {
      type: "array",
      minItems: 5,
      maxItems: 8,
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

export const CATEGORY_SCHEMAS = {
  diet: DIET_SCHEMA,
  hygiene: HYGIENE_SCHEMA,
  health: HEALTH_SCHEMA,
  insurance: INSURANCE_SCHEMA,
  materials: MATERIALS_SCHEMA,
} as const;

export type Category = keyof typeof CATEGORY_SCHEMAS;
