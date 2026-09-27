"use client";

import { useState } from "react";
import { LoaderCircle, SlidersHorizontal, TriangleAlert, X } from "lucide-react";
import { refineCareReportAction } from "@/app/pets/actions";
import { friendlyReason } from "@/components/generate-care-plan-form";
import { SubmitButton } from "@/components/submit-button";
import type { Category } from "@/lib/agents/schemas";

const EXAMPLES: Record<Category, string> = {
  diet: "e.g. add some healthy treats, or: cheaper food options",
  hygiene: "e.g. add a nail clipper, or: fragrance-free products",
  health: "e.g. what about joint care? or: she's very active",
  insurance: "e.g. lowest monthly cost, best for older pets",
  materials: "e.g. add a GPS collar, or: keep it under $100",
};

// The card's "Adjust" button and, once opened, a one-line request that
// re-runs just this card's specialist. Renders inside the card header's
// flex-wrap row: the form takes a full row of its own.
export function RefineReportForm({ petId, category, label }: { petId: string; category: Category; label: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <SlidersHorizontal className="size-3.5" />
        Adjust
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setError("");
        }}
        aria-label="Close"
        className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      <form
        action={async (formData) => {
          setError("");
          const result = await refineCareReportAction(formData);
          if (result.ok) setOpen(false);
          else setError(result.error);
        }}
        className="basis-full rounded-2xl bg-secondary/60 p-3"
      >
        <input type="hidden" name="pet_id" value={petId} />
        <input type="hidden" name="category" value={category} />
        <label htmlFor={`refine-${category}`} className="text-sm font-semibold">
          What should the {label.toLowerCase()} specialist change?
        </label>
        <textarea
          id={`refine-${category}`}
          name="request"
          required
          minLength={3}
          maxLength={300}
          rows={2}
          autoFocus
          placeholder={EXAMPLES[category]}
          className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        {error && (
          <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-destructive">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            {friendlyReason(error) === "Something went wrong." ? error : friendlyReason(error)}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {category === "insurance"
              ? "Lasting facts like allergies belong in the pet's profile."
              : "Extras like treats are added alongside the plan; asking for alternatives updates it."}
          </p>
          <SubmitButton
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-70"
            pendingLabel={
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Updating…
              </>
            }
          >
            Update {label}
          </SubmitButton>
        </div>
      </form>
    </>
  );
}
