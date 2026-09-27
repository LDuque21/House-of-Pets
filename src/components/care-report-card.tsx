import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import type { CareReport } from "@/lib/care-reports";
import type { Pet, Species } from "@/lib/pets";
import { INSURANCE_PROVIDERS, type InsuranceProviderKey } from "@/lib/agents/insurance-providers";
import { ESSENTIALS, matchEssentials } from "@/lib/agents/essentials";
import { CATEGORY_META } from "@/components/category-meta";
import { amazonSearchUrl, frequencyLabel, nearbySearchUrl } from "@/lib/format";

function money(range: { low: number; high: number } | undefined) {
  if (!range) return null;
  return `$${range.low}–$${range.high}`;
}

function Price({ range, suffix = "" }: { range: { low: number; high: number } | undefined; suffix?: string }) {
  const text = money(range);
  if (!text) return null;
  return (
    <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
      {text}
      {suffix}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
      {children}
    </span>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm marker:text-primary/60">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Routine({ name, days, notes }: { name: string; days: number | undefined; notes: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{name}</p>
        <Tag>{frequencyLabel(days)}</Tag>
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">{notes}</p>
    </div>
  );
}

type Range = { low: number; high: number };
type ProductOption = { product_name?: string; price_range?: Range; package?: string; note?: string };
type Screening = { name?: string; frequency_days?: number; why?: string };
type Milestone = { name?: string; starts?: string; why?: string };
type ConditionCare = { condition?: string; what_to_do?: string; vet_followup_days?: number; red_flags?: string };

function AmazonLink({ name }: { name: string }) {
  return (
    <a
      href={amazonSearchUrl(name)}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="font-semibold text-primary underline-offset-4 hover:underline"
    >
      {name}
      <ExternalLink className="ml-1 inline size-3.5 align-[-0.125em]" />
    </a>
  );
}

// Up to three products for one need, each linked to Amazon with a price range.
function ProductOptions({ options, detailed = false }: { options: ProductOption[]; detailed?: boolean }) {
  return (
    <ul className="mt-1.5 space-y-2">
      {options
        .filter((o) => o.product_name)
        .map((o, i) => (
          <li key={i} className="text-sm">
            <div className="flex items-start justify-between gap-3">
              <AmazonLink name={o.product_name!} />
              <Price range={o.price_range} />
            </div>
            {detailed && (o.package || o.note) && (
              <p className="mt-0.5 text-muted-foreground">{[o.package, o.note].filter(Boolean).join(" · ")}</p>
            )}
          </li>
        ))}
    </ul>
  );
}

function AmazonFootnote() {
  return <p className="mt-4 text-xs text-muted-foreground">Links open on Amazon. Prices are estimates.</p>;
}

type MaterialItem ={ name?: string; purpose?: string; price_range?: { low: number; high: number } };
type Row = { name: string; purpose: string; price?: { low: number; high: number }; mustHave: boolean; shoppable: boolean };

const STORE_SEARCH: Record<Species, string> = {
  dog: "pet store",
  cat: "pet store",
  rabbit: "pet store",
  hamster: "pet store",
  fish: "aquarium store",
  bird: "bird supply store",
  reptile: "reptile supply store",
  horse: "tack and feed store",
};

// The species' must-haves always appear (even if the agent left one out),
// plus whatever extra items the agent thinks this pet needs.
function MaterialsBody({ items, pet }: { items: MaterialItem[]; pet: Pet }) {
  const matches = matchEssentials(pet.species, items.map((item) => item.name ?? ""));
  const covered = new Set(matches.values());
  const fromAgent: Row[] = items.map((item, i) => {
    const essential = matches.get(i);
    const price = item.price_range && item.price_range.high > 0 ? item.price_range : undefined;
    return {
      name: item.name ?? "",
      purpose: item.purpose ?? "",
      price,
      mustHave: Boolean(essential),
      shoppable: !essential?.activity && Boolean(price),
    };
  });
  const missing: Row[] = ESSENTIALS[pet.species]
    .filter((essential) => !covered.has(essential))
    .map((essential) => ({ name: essential.name, purpose: essential.purpose, mustHave: true, shoppable: !essential.activity }));
  const rows = [...fromAgent.filter((row) => row.mustHave), ...missing, ...fromAgent.filter((row) => !row.mustHave)];
  const storesUrl = nearbySearchUrl(STORE_SEARCH[pet.species], pet);

  return (
    <>
      {storesUrl ? (
        <a
          href={storesUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground hover:bg-accent"
        >
          <MapPin className="size-4 text-primary" />
          Stores near {pet.location_label || "you"}
          <ExternalLink className="ml-auto size-3.5" />
        </a>
      ) : (
        <Link
          href={`/pets/${pet.id}/edit`}
          className="mb-4 flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <MapPin className="size-4" />
          Add where {pet.name} lives to find these nearby
        </Link>
      )}
      <ul className="space-y-3">
        {rows.map((row, i) => {
          const nearby = row.shoppable ? nearbySearchUrl(row.name, pet) : null;
          return (
            <li key={`${i}-${row.name}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="flex flex-wrap items-center gap-x-2 font-semibold">
                  {row.name}
                  {row.mustHave && (
                    <span className="rounded-full bg-materials-soft px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-materials">
                      Must-have
                    </span>
                  )}
                </p>
                <Price range={row.price} />
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {row.purpose}
                {nearby && (
                  <>
                    {" "}
                    <a
                      href={nearby}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whitespace-nowrap font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Find nearby
                    </a>
                  </>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function CategoryBody({ report, pet }: { report: CareReport; pet: Pet }) {
  const c = report.content as Record<string, any>;

  switch (report.category) {
    case "diet":
      if (Array.isArray(c.food_options)) {
        return (
          <>
            <Section title="Food picks">
              <ProductOptions options={c.food_options} detailed />
            </Section>
            <p className="mt-4 text-sm">{c.feeding_instructions}</p>
            {c.cautions?.length > 0 && (
              <Section title="Cautions">
                <List items={c.cautions} />
              </Section>
            )}
            <AmazonFootnote />
          </>
        );
      }
      // Reports saved before product picks (one food + brand names).
      return (
        <>
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold">{c.primary_food?.name}</p>
            <Price range={c.primary_food?.price_range} suffix="/mo" />
          </div>
          {c.primary_food?.brand_examples?.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">{c.primary_food.brand_examples.join(", ")}</p>
          )}
          <p className="mt-3 text-sm">{c.feeding_instructions}</p>
          {c.cautions?.length > 0 && (
            <Section title="Cautions">
              <List items={c.cautions} />
            </Section>
          )}
        </>
      );
    case "hygiene":
      return (
        <>
          <div className="space-y-3">
            <Routine name="Bathing" days={c.bathing?.frequency_days} notes={c.bathing?.notes} />
            <Routine
              name="Dental care"
              days={c.dental_care?.frequency_days}
              notes={
                <>
                  {c.dental_care?.notes}
                  {c.dental_care?.dental_treats?.length ? ` (${c.dental_care.dental_treats.join(", ")})` : ""}
                </>
              }
            />
            <Routine name="Cleanup" days={c.cleanup?.frequency_days} notes={c.cleanup?.notes} />
          </div>
          {c.products?.length > 0 &&
            c.products.map((group: { need?: string; options?: ProductOption[] }, i: number) => (
              <Section key={i} title={group.need ?? "Products"}>
                <ProductOptions options={group.options ?? []} />
              </Section>
            ))}
          {c.products?.length > 0 && <AmazonFootnote />}
          {/* Reports saved before product picks listed plain supply names. */}
          {c.supplies?.length > 0 && (
            <Section title="Supplies">
              <List items={c.supplies} />
            </Section>
          )}
        </>
      );
    case "health":
      return (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">Vet checkups</p>
            <Tag>{frequencyLabel(c.checkup_frequency_days)}</Tag>
          </div>
          {c.condition_care?.length > 0 && (
            <Section title="Managing known conditions">
              <ul className="mt-1.5 space-y-3">
                {c.condition_care.map((cc: ConditionCare, i: number) => (
                  <li key={i} className="rounded-2xl bg-health-soft px-3 py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold capitalize">{cc.condition}</p>
                      {(cc.vet_followup_days ?? 0) > 0 && <Tag>Vet: {frequencyLabel(cc.vet_followup_days).toLowerCase()}</Tag>}
                    </div>
                    <p className="mt-1">{cc.what_to_do}</p>
                    {cc.red_flags && (
                      <p className="mt-1 text-muted-foreground">
                        <span className="font-semibold text-foreground">Call the vet if: </span>
                        {cc.red_flags}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                General guidance only. Follow your vet&apos;s treatment plan.
              </p>
            </Section>
          )}
          {c.screenings?.length > 0 && (
            <Section title="Screenings for this age">
              <ul className="mt-1.5 space-y-2">
                {c.screenings.map((s: Screening, i: number) => (
                  <li key={i} className="text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{s.name}</p>
                      <Tag>{frequencyLabel(s.frequency_days)}</Tag>
                    </div>
                    <p className="mt-0.5 text-muted-foreground">{s.why}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {c.upcoming_milestones?.length > 0 && (
            <Section title="Coming up with age">
              <ul className="mt-1.5 space-y-2">
                {c.upcoming_milestones.map((m: Milestone, i: number) => (
                  <li key={i} className="text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{m.name}</p>
                      <Tag>{m.starts}</Tag>
                    </div>
                    <p className="mt-0.5 text-muted-foreground">{m.why}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {c.vaccinations?.length > 0 && (
            <Section title="Vaccinations">
              <List items={c.vaccinations} />
            </Section>
          )}
          {c.warning_signs?.length > 0 && (
            <Section title="Warning signs">
              <List items={c.warning_signs} />
            </Section>
          )}
        </>
      );
    case "insurance":
      if (c.providers?.length === 0) {
        return (
          <p className="text-sm text-muted-foreground">
            None of the insurers we track cover this kind of pet. An exotics vet can tell you about
            wellness plans or savings options instead.
          </p>
        );
      }
      return (
        <ul className="space-y-3">
          {c.providers?.map((p: any, i: number) => {
            const provider = INSURANCE_PROVIDERS[p.provider_key as InsuranceProviderKey];
            return (
              <li key={i}>
                <div className="flex items-center justify-between gap-3">
                  {provider ? (
                    <a
                      href={provider.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      {provider.name}
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    <span className="font-semibold">{p.provider_key}</span>
                  )}
                  <Price range={p.estimated_monthly_range} suffix="/mo" />
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{p.notes}</p>
              </li>
            );
          })}
        </ul>
      );
    case "materials":
      return <MaterialsBody items={c.items ?? []} pet={pet} />;
    default:
      return null;
  }
}

export function CareReportCard({ report, pet }: { report: CareReport; pet: Pet }) {
  const meta = CATEGORY_META[report.category];
  return (
    <article className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-sm">
      <header className="flex items-center gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${meta?.tint ?? "bg-muted"}`}>
          {meta && <meta.Icon className="size-5" />}
        </span>
        <h3 className="text-lg font-semibold">{meta?.label ?? report.category}</h3>
      </header>
      <div className="mt-4 flex-1">
        <CategoryBody report={report} pet={pet} />
      </div>
    </article>
  );
}
