import type { CareReport } from "@/lib/care-reports";

const CATEGORY_LABELS: Record<string, string> = {
  diet: "Diet",
  hygiene: "Hygiene",
  health: "Health",
  insurance: "Insurance",
  behavior: "Behavior",
};

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function CategoryBody({ report }: { report: CareReport }) {
  const c = report.content as Record<string, any>;

  switch (report.category) {
    case "diet":
      return (
        <>
          <ul className="space-y-2 text-sm">
            {c.recommendations?.map((r: any, i: number) => (
              <li key={i}>
                <span className="font-medium">{r.item}</span>
                {r.brand_examples?.length ? ` — ${r.brand_examples.join(", ")}` : ""}
                <p className="text-muted-foreground">{r.notes}</p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted-foreground">
            {c.frequency?.value}x per day
          </p>
          {c.cautions?.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium">Cautions</p>
              <List items={c.cautions} />
            </div>
          )}
        </>
      );
    case "hygiene":
      return (
        <>
          <ul className="space-y-2 text-sm">
            {c.routines?.map((r: any, i: number) => (
              <li key={i}>
                <span className="font-medium">{r.task}</span>{" "}
                <span className="text-muted-foreground">
                  every {r.frequency_days}d
                </span>
                <p className="text-muted-foreground">{r.notes}</p>
              </li>
            ))}
          </ul>
          {c.supplies?.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium">Supplies</p>
              <List items={c.supplies} />
            </div>
          )}
        </>
      );
    case "health":
      return (
        <>
          <p className="text-sm">
            Vet checkups every {c.vet_checkup_frequency_days} days
          </p>
          {c.vaccinations?.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium">Vaccinations</p>
              <List items={c.vaccinations} />
            </div>
          )}
          {c.warning_signs?.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium">Warning signs</p>
              <List items={c.warning_signs} />
            </div>
          )}
        </>
      );
    case "insurance":
      return (
        <>
          {c.coverage_types?.length > 0 && (
            <div>
              <p className="text-sm font-medium">Coverage types</p>
              <List items={c.coverage_types} />
            </div>
          )}
          <p className="mt-3 text-sm">
            Estimated: ${c.estimated_monthly_cost_range?.low}–$
            {c.estimated_monthly_cost_range?.high}/mo
          </p>
          {c.notes && <p className="mt-2 text-sm text-muted-foreground">{c.notes}</p>}
        </>
      );
    default:
      return null;
  }
}

export function CareReportCard({ report }: { report: CareReport }) {
  const content = report.content as Record<string, any>;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold">{CATEGORY_LABELS[report.category] ?? report.category}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{content.summary}</p>
      <div className="mt-3">
        <CategoryBody report={report} />
      </div>
    </div>
  );
}
