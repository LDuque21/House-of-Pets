import type { CareReport } from "@/lib/care-reports";
import { INSURANCE_PROVIDERS, type InsuranceProviderKey } from "@/lib/agents/insurance-providers";

const CATEGORY_LABELS: Record<string, string> = {
  diet: "Diet",
  hygiene: "Hygiene",
  health: "Health",
  insurance: "Insurance",
  materials: "Materials",
};

function money(range: { low: number; high: number } | undefined) {
  if (!range) return null;
  return `$${range.low}–$${range.high}`;
}

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
          <p className="text-sm">
            <span className="font-medium">{c.primary_food?.name}</span>
            {c.primary_food?.brand_examples?.length
              ? ` — ${c.primary_food.brand_examples.join(", ")}`
              : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {money(c.primary_food?.price_range)}/mo
          </p>
          <p className="mt-2 text-sm">{c.feeding_instructions}</p>
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
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Bathing</span> — every {c.bathing?.frequency_days}d.{" "}
            {c.bathing?.notes}
          </p>
          <p>
            <span className="font-medium">Dental</span> — every {c.dental_care?.frequency_days}d.{" "}
            {c.dental_care?.notes}
            {c.dental_care?.dental_treats?.length
              ? ` (${c.dental_care.dental_treats.join(", ")})`
              : ""}
          </p>
          <p>
            <span className="font-medium">Cleanup</span> — every {c.cleanup?.frequency_days}d.{" "}
            {c.cleanup?.notes}
          </p>
          {c.supplies?.length > 0 && (
            <div className="mt-3">
              <p className="font-medium">Supplies</p>
              <List items={c.supplies} />
            </div>
          )}
        </div>
      );
    case "health":
      return (
        <>
          <p className="text-sm">Vet checkups every {c.checkup_frequency_days} days</p>
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
        <ul className="space-y-2 text-sm">
          {c.providers?.map((p: any, i: number) => {
            const provider = INSURANCE_PROVIDERS[p.provider_key as InsuranceProviderKey];
            return (
              <li key={i}>
                {provider ? (
                  <a
                    href={provider.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    {provider.name}
                  </a>
                ) : (
                  <span className="font-medium">{p.provider_key}</span>
                )}{" "}
                — {money(p.estimated_monthly_range)}/mo
                <p className="text-muted-foreground">{p.notes}</p>
              </li>
            );
          })}
        </ul>
      );
    case "materials":
      return (
        <ul className="space-y-2 text-sm">
          {c.items?.map((item: any, i: number) => (
            <li key={i}>
              <span className="font-medium">{item.name}</span> — {money(item.price_range)}
              <p className="text-muted-foreground">{item.purpose}</p>
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

export function CareReportCard({ report }: { report: CareReport }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold">{CATEGORY_LABELS[report.category] ?? report.category}</h3>
      <div className="mt-3">
        <CategoryBody report={report} />
      </div>
    </div>
  );
}
