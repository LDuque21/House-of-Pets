import Link from "next/link";
import { ExternalLink, MapPin, Plus, SlidersHorizontal } from "lucide-react";
import type { Category } from "@/lib/agents/schemas";
import type { CareReport } from "@/lib/care-reports";
import type { Pet, Species } from "@/lib/pets";
import {
  INSURANCE_PROVIDERS,
  providersFor,
  VET_FINANCING,
  type InsuranceProviderKey,
} from "@/lib/agents/insurance-providers";
import { RefineReportForm } from "@/components/refine-report-form";
import { ESSENTIALS, matchEssentials, type Essential } from "@/lib/agents/essentials";
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

function Routine({
  name,
  days,
  notes,
  children,
}: {
  name: string;
  days: number | undefined;
  notes: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{name}</p>
        <Tag>{frequencyLabel(days)}</Tag>
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">{notes}</p>
      {children}
    </div>
  );
}

type ProductGroup = { need?: string; options?: ProductOption[] };
type HygieneRoutine = { frequency_days?: number; notes?: string; products?: ProductGroup[] };

// "Toothpaste: we recommend these", nested under the routine that uses it.
function RoutineProducts({ groups }: { groups: ProductGroup[] | undefined }) {
  if (!groups?.length) return null;
  return (
    <div className="mt-2 space-y-2.5 border-l-2 border-hygiene-soft pl-3">
      {groups.map((group, i) => (
        <div key={i}>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{group.need}</p>
          <ProductOptions options={group.options ?? []} />
        </div>
      ))}
    </div>
  );
}

function HygieneBody({ c }: { c: Record<string, unknown> }) {
  const routines: [string, HygieneRoutine | undefined][] = [
    ["Bathing", c.bathing as HygieneRoutine | undefined],
    ["Dental care", c.dental_care as HygieneRoutine | undefined],
    ["Cleanup", c.cleanup as HygieneRoutine | undefined],
  ];
  // Older reports: one product list for the whole card, or plain supply names.
  const flatProducts = (c.products ?? []) as ProductGroup[];
  const supplies = (c.supplies ?? []) as string[];
  const dentalTreats = (c.dental_care as { dental_treats?: string[] } | undefined)?.dental_treats;
  return (
    <>
      <div className="space-y-4">
        {routines.map(([name, routine]) => (
          <Routine
            key={name}
            name={name}
            days={routine?.frequency_days}
            notes={
              <>
                {routine?.notes}
                {name === "Dental care" && dentalTreats?.length ? ` (${dentalTreats.join(", ")})` : ""}
              </>
            }
          >
            <RoutineProducts groups={routine?.products} />
          </Routine>
        ))}
      </div>
      {flatProducts.map((group, i) => (
        <Section key={i} title={group.need ?? "Products"}>
          <ProductOptions options={group.options ?? []} />
        </Section>
      ))}
      {supplies.length > 0 && (
        <Section title="Supplies">
          <List items={supplies} />
        </Section>
      )}
    </>
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
            <AmazonLink name={o.product_name!} />
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <Price range={o.price_range} />
              {detailed && (o.package || o.note) && (
                <span className="text-muted-foreground">{[o.package, o.note].filter(Boolean).join(" · ")}</span>
              )}
            </div>
          </li>
        ))}
    </ul>
  );
}

function AmazonFootnote() {
  return <p className="mt-4 text-xs text-muted-foreground">Links open on Amazon. Prices are estimates.</p>;
}

type MaterialItem ={ name?: string; purpose?: string; price_range?: { low: number; high: number } };
type Row = {
  name: string;
  purpose: string;
  price?: { low: number; high: number };
  tier: "must" | "recommended" | null; // null: an extra the agent added
  shoppable: boolean;
};

const STORE_SEARCH: Record<Species, string> = {
  dog: "pet store",
  cat: "pet store",
  rabbit: "pet store",
  hamster: "pet store",
  fish: "aquarium store",
  bird: "bird supply store",
  reptile: "reptile supply store",
  horse: "tack and feed store",
  guinea_pig: "pet store",
  rat: "pet store",
  chinchilla: "pet store",
  raccoon: "exotic pet supply store",
};

const tierOf = (essential: Essential | undefined): Row["tier"] =>
  !essential ? null : essential.recommended ? "recommended" : "must";

// The species' must-have and recommended items always appear (even if the
// agent left one out) unless the owner removed them through Adjust, plus
// whatever extra items the agent thinks this pet needs.
function MaterialsBody({ items, removed, pet }: { items: MaterialItem[]; removed: string[]; pet: Pet }) {
  const matches = matchEssentials(pet.species, items.map((item) => item.name ?? ""));
  const covered = new Set(matches.values());
  const isRemoved = (essential: Essential | undefined) => Boolean(essential && removed.includes(essential.name));
  const fromAgent: Row[] = items.flatMap((item, i) => {
    const essential = matches.get(i);
    if (isRemoved(essential)) return [];
    const price = item.price_range && item.price_range.high > 0 ? item.price_range : undefined;
    return [
      {
        name: item.name ?? "",
        purpose: item.purpose ?? "",
        price,
        tier: tierOf(essential),
        shoppable: !essential?.activity && Boolean(price),
      },
    ];
  });
  const missing: Row[] = ESSENTIALS[pet.species]
    .filter((essential) => !covered.has(essential) && !isRemoved(essential))
    .map((essential) => ({
      name: essential.name,
      purpose: essential.purpose,
      tier: tierOf(essential),
      shoppable: !essential.activity,
    }));
  const all = [...fromAgent, ...missing];
  const rows = [
    ...all.filter((row) => row.tier === "must"),
    ...all.filter((row) => row.tier === "recommended"),
    ...all.filter((row) => row.tier === null),
  ];
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
                  {row.tier === "must" && (
                    <span className="rounded-full bg-materials-soft px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-materials">
                      Must-have
                    </span>
                  )}
                  {row.tier === "recommended" && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-secondary-foreground">
                      Recommended
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
      {removed.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          Not needed for {pet.name}: {removed.join(", ")}. Use Adjust to bring any back.
        </p>
      )}
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
      return <HygieneBody c={c} />;
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
      return <InsuranceBody c={c} pet={pet} />;
    case "materials":
      return (
        <MaterialsBody
          items={c.items ?? []}
          removed={Array.isArray(c.removed_essentials) ? c.removed_essentials : []}
          pet={pet}
        />
      );
    default:
      return null;
  }
}

type ProviderPick = { provider_key?: string; estimated_monthly_range?: Range; notes?: string };
type CostPlanning = { typical_costs?: { item?: string; price_range?: Range }[]; monthly_savings?: Range; tip?: string };

// Insurers that cover the species (from the fixed list), then cost planning
// for every pet. With one or no insurer, vet financing options are added so
// exotic-pet owners still get a way to handle big bills.
function InsuranceBody({ c, pet }: { c: Record<string, unknown>; pet: Pet }) {
  const providers = (Array.isArray(c.providers) ? c.providers : []) as ProviderPick[];
  const planning = c.cost_planning as CostPlanning | undefined;
  const fewInsurers = providersFor(pet.species).length <= 1;
  return (
    <>
      {providers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          None of the insurers we track cover this kind of pet, so here&apos;s how to plan
          for vet costs instead.
        </p>
      ) : (
        <ul className="space-y-3">
          {providers.map((p, i) => {
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
      )}
      {planning && (
        <Section title="Planning for vet costs">
          <ul className="mt-1.5 space-y-1.5 text-sm">
            {planning.typical_costs?.map((cost, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span>{cost.item}</span>
                <Price range={cost.price_range} />
              </li>
            ))}
            {planning.monthly_savings && (
              <li className="flex items-center justify-between gap-3 font-semibold">
                <span>Set aside</span>
                <Price range={planning.monthly_savings} suffix="/mo" />
              </li>
            )}
          </ul>
          {planning.tip && <p className="mt-2 text-sm text-muted-foreground">{planning.tip}</p>}
        </Section>
      )}
      {fewInsurers && (
        <Section title="Paying for a big vet bill">
          <ul className="mt-1.5 space-y-1.5 text-sm">
            {VET_FINANCING.map((option) => (
              <li key={option.name}>
                <a
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {option.name}
                  <ExternalLink className="size-3.5" />
                </a>{" "}
                <span className="text-muted-foreground">{option.note}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-muted-foreground">Ask your vet which ones they accept.</p>
        </Section>
      )}
    </>
  );
}

export function CareReportCard({ report, pet }: { report: CareReport; pet: Pet }) {
  const meta = CATEGORY_META[report.category];
  return (
    <article className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-sm">
      <header className="flex flex-wrap items-center gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${meta?.tint ?? "bg-muted"}`}>
          {meta && <meta.Icon className="size-5" />}
        </span>
        <h3 className="min-w-0 flex-1 text-lg font-semibold">{meta?.label ?? report.category}</h3>
        <RefineReportForm petId={pet.id} category={report.category} label={meta.label} />
      </header>
      {report.request && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
          <SlidersHorizontal className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Adjusted for: <span className="italic">&ldquo;{report.request}&rdquo;</span>
          </span>
        </p>
      )}
      <div className="mt-4 flex-1">
        <CategoryBody report={report} pet={pet} />
        <Extras category={report.category} extras={report.content.extras} />
        {hasAmazonLinks(report.content) && <AmazonFootnote />}
      </div>
    </article>
  );
}

// What the owner added through Adjust (treats, a supplement, a health
// question), shown after the main recommendations, which stay as they were.
function Extras({ category, extras }: { category: Category; extras: unknown }) {
  if (!Array.isArray(extras) || extras.length === 0) return null;
  return (
    <div className="mt-5 border-t border-dashed border-border pt-1">
      <p className="mt-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
        <Plus className="size-3.5" />
        Added at your request
      </p>
      {category === "health"
        ? (extras as { topic?: string; advice?: string }[]).map((e, i) => (
            <div key={i} className="mt-2 text-sm">
              <p className="font-semibold">{e.topic}</p>
              <p className="mt-0.5 text-muted-foreground">{e.advice}</p>
            </div>
          ))
        : (extras as ProductGroup[]).map((group, i) => (
            <Section key={i} title={group.need ?? "Extras"}>
              <ProductOptions options={group.options ?? []} />
            </Section>
          ))}
    </div>
  );
}

function hasAmazonLinks(c: Record<string, unknown>): boolean {
  const routines = [c.bathing, c.dental_care, c.cleanup] as ({ products?: unknown[] } | undefined)[];
  return (
    Array.isArray(c.food_options) ||
    (Array.isArray(c.products) && c.products.length > 0) ||
    routines.some((r) => (r?.products?.length ?? 0) > 0) ||
    (c.category !== "health" && Array.isArray(c.extras) && c.extras.length > 0)
  );
}
