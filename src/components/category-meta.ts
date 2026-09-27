import { Bath, HeartPulse, ShieldCheck, ShoppingBasket, Utensils, type LucideIcon } from "lucide-react";
import type { Category } from "@/lib/agents/schemas";

// Display details for the five care-plan categories, shared by the landing
// page, the report cards, the generate form and the task list.
export const CATEGORY_META: Record<Category, { label: string; Icon: LucideIcon; tint: string; blurb: string }> = {
  diet: {
    label: "Diet",
    Icon: Utensils,
    tint: "bg-diet-soft text-diet",
    blurb: "The right food, how much to feed, and what it costs.",
  },
  hygiene: {
    label: "Hygiene",
    Icon: Bath,
    tint: "bg-hygiene-soft text-hygiene",
    blurb: "Bathing, dental care, and litter or cleanup routines.",
  },
  health: {
    label: "Health",
    Icon: HeartPulse,
    tint: "bg-health-soft text-health",
    blurb: "Checkups, key vaccines, and warning signs to watch for.",
  },
  insurance: {
    label: "Insurance",
    Icon: ShieldCheck,
    tint: "bg-insurance-soft text-insurance",
    blurb: "Real insurers that cover your species, with monthly estimates.",
  },
  materials: {
    label: "Materials",
    Icon: ShoppingBasket,
    tint: "bg-materials-soft text-materials",
    blurb: "A starter shopping list of everyday supplies.",
  },
};

export const CATEGORY_ORDER: Category[] = ["diet", "hygiene", "health", "insurance", "materials"];
