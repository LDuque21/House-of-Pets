export const DIET_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["diet"] },
    summary: { type: "string" },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string" },
          brand_examples: { type: "array", items: { type: "string" } },
          notes: { type: "string" },
        },
        required: ["item", "brand_examples", "notes"],
      },
    },
    frequency: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["times_per_day"] },
      },
      required: ["value", "unit"],
    },
    cautions: { type: "array", items: { type: "string" } },
  },
  required: ["category", "summary", "recommendations", "frequency", "cautions"],
};

export const HYGIENE_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["hygiene"] },
    summary: { type: "string" },
    routines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          task: { type: "string" },
          frequency_days: { type: "number" },
          notes: { type: "string" },
        },
        required: ["task", "frequency_days", "notes"],
      },
    },
    supplies: { type: "array", items: { type: "string" } },
  },
  required: ["category", "summary", "routines", "supplies"],
};

export const HEALTH_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["health"] },
    summary: { type: "string" },
    vet_checkup_frequency_days: { type: "number" },
    vaccinations: { type: "array", items: { type: "string" } },
    warning_signs: { type: "array", items: { type: "string" } },
  },
  required: [
    "category",
    "summary",
    "vet_checkup_frequency_days",
    "vaccinations",
    "warning_signs",
  ],
};

export const INSURANCE_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["insurance"] },
    summary: { type: "string" },
    coverage_types: { type: "array", items: { type: "string" } },
    estimated_monthly_cost_range: {
      type: "object",
      properties: {
        low: { type: "number" },
        high: { type: "number" },
        currency: { type: "string", enum: ["USD"] },
      },
      required: ["low", "high", "currency"],
    },
    notes: { type: "string" },
  },
  required: ["category", "summary", "coverage_types", "estimated_monthly_cost_range", "notes"],
};

export const CATEGORY_SCHEMAS = {
  diet: DIET_SCHEMA,
  hygiene: HYGIENE_SCHEMA,
  health: HEALTH_SCHEMA,
  insurance: INSURANCE_SCHEMA,
} as const;

export type Category = keyof typeof CATEGORY_SCHEMAS;
