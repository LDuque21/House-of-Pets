"use client";

import { useActionState } from "react";
import { generateCarePlanAction, type GenerateCarePlanState } from "@/app/pets/actions";

const CATEGORY_LABELS: Record<string, string> = {
  diet: "Diet",
  hygiene: "Hygiene",
  health: "Health",
  insurance: "Insurance",
};

export function GenerateCarePlanForm({
  petId,
  hasExistingReports,
}: {
  petId: string;
  hasExistingReports: boolean;
}) {
  const [state, formAction, isPending] = useActionState<GenerateCarePlanState, FormData>(
    generateCarePlanAction,
    null
  );

  const failures = state?.results.filter((r) => r.status === "error") ?? [];

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="pet_id" value={petId} />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {isPending
            ? "Generating…"
            : hasExistingReports
              ? "Regenerate care plan"
              : "Generate care plan"}
        </button>
      </form>

      {failures.length > 0 && (
        <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
          <p className="font-medium text-destructive">
            {failures.length} of {state!.results.length} categories failed:
          </p>
          <ul className="mt-1 list-disc pl-5">
            {failures.map((f) => (
              <li key={f.category}>
                {CATEGORY_LABELS[f.category] ?? f.category}: {f.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
