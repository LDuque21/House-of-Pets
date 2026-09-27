"use client";

import { useActionState } from "react";
import { AlertTriangle, LoaderCircle, Sparkles } from "lucide-react";
import { generateCarePlanAction, type GenerateCarePlanState } from "@/app/pets/actions";
import { CATEGORY_META, CATEGORY_ORDER } from "@/components/category-meta";
import { buttonVariants } from "@/components/ui/button";
import type { Category } from "@/lib/agents/schemas";

// Plain-language reasons for the Gemini failures we've actually hit; the raw
// error stays available under "Details".
export function friendlyReason(error: string): string {
  if (/\b401\b|UNAUTHENTICATED/.test(error)) return "Gemini didn't accept the API key.";
  if (/\b429\b|RESOURCE_EXHAUSTED/.test(error)) return "Gemini's rate limit was reached. Try again in a minute.";
  if (/\b503\b|UNAVAILABLE|overloaded/i.test(error)) return "Gemini is busy right now. Try again shortly.";
  if (error.includes("didn't match the schema")) return "Gemini's answer came back in the wrong shape. Try again.";
  return "Something went wrong.";
}

export function GenerateCarePlanForm({
  petId,
  petName,
  hasExistingReports,
}: {
  petId: string;
  petName: string;
  hasExistingReports: boolean;
}) {
  const [state, formAction, isPending] = useActionState<GenerateCarePlanState, FormData>(
    generateCarePlanAction,
    null
  );

  const failures = state?.results.filter((r) => r.status === "error") ?? [];
  // One line per distinct reason, e.g. "Diet, Health: Gemini is busy right now."
  const byReason = new Map<string, Category[]>();
  for (const failure of failures) {
    const reason = friendlyReason(failure.error);
    byReason.set(reason, [...(byReason.get(reason) ?? []), failure.category]);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-lg font-semibold">
            {hasExistingReports ? "Want a fresh plan?" : `Ready to build ${petName}'s care plan?`}
          </p>
          <p className="text-sm text-muted-foreground">
            {isPending
              ? "Five specialists are working on it at the same time…"
              : "Five specialist agents each write one part, powered by Gemini."}
          </p>
        </div>
        <form action={formAction}>
          <input type="hidden" name="pet_id" value={petId} />
          <button type="submit" disabled={isPending} className={buttonVariants({ size: "xl" })}>
            {isPending ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
            {isPending ? "Generating…" : hasExistingReports ? "Regenerate care plan" : "Generate care plan"}
          </button>
        </form>
      </div>

      {isPending && (
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Specialists working">
          {CATEGORY_ORDER.map((category) => {
            const { label, Icon, tint } = CATEGORY_META[category];
            return (
              <li
                key={category}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold animate-pulse motion-reduce:animate-none ${tint}`}
              >
                <Icon className="size-4" />
                {label}
              </li>
            );
          })}
        </ul>
      )}

      {!isPending && failures.length > 0 && (
        <div role="alert" className="mt-5 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="size-4" />
            {failures.length === state!.results.length
              ? "The care plan couldn't be updated."
              : `${failures.length} of ${state!.results.length} sections couldn't be updated.`}
          </p>
          <ul className="mt-2 space-y-1">
            {[...byReason].map(([reason, categories]) => (
              <li key={reason}>
                <span className="font-semibold">
                  {categories.map((category) => CATEGORY_META[category].label).join(", ")}:
                </span>{" "}
                {reason}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-muted-foreground">Sections that failed keep their last saved version.</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-muted-foreground">Details</summary>
            <ul className="mt-2 space-y-2 break-all font-mono text-xs text-muted-foreground">
              {failures.map((failure) => (
                <li key={failure.category}>
                  {CATEGORY_META[failure.category].label}: {failure.error}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}
