import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarCheck, ChevronLeft, HeartPulse, MapPin, Pencil, TriangleAlert } from "lucide-react";
import { auth } from "@/lib/auth/server";
import { getPetForUser } from "@/lib/pets";
import { listCareReportsForPet, listTasksForPet, type Task } from "@/lib/care-reports";
import { CareReportCard } from "@/components/care-report-card";
import { GenerateCarePlanForm } from "@/components/generate-care-plan-form";
import { AnimalSilhouette, PetAvatar } from "@/components/animal-silhouettes";
import { CATEGORY_ORDER } from "@/components/category-meta";
import { buttonVariants } from "@/components/ui/button";
import { conditionList, petSummary } from "@/lib/format";

// A one-line status of the routine, linking to its own screen.
function RoutineBanner({ petId, tasks }: { petId: string; tasks: Task[] }) {
  const scheduled = tasks.filter((t) => t.frequency_days > 1);
  const overdue = scheduled.filter((t) => t.due_in_days < 0).length;
  const dueToday = scheduled.filter((t) => t.due_in_days === 0).length;
  const next = scheduled.filter((t) => t.due_in_days > 0).sort((a, b) => a.due_in_days - b.due_in_days)[0];
  const status = [
    overdue > 0 && `${overdue} overdue`,
    dueToday > 0 && `${dueToday} due today`,
    next && `Next: ${next.task_name}, ${new Date(`${next.next_due}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`,
  ].filter(Boolean);

  return (
    <Link
      href={`/pets/${petId}/routine`}
      className="mt-6 flex flex-col gap-3 rounded-3xl border border-border bg-card px-5 py-4 shadow-sm transition hover:border-primary/50 sm:flex-row sm:items-center"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
        <CalendarCheck className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-lg font-semibold">Care routine and calendar</span>
        <span className={overdue > 0 ? "text-sm font-semibold text-destructive" : "text-sm text-muted-foreground"}>
          {tasks.length === 0 ? "Routines from the plan show up here." : status.join(" · ") || "All caught up."}
        </span>
      </span>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        Open
        <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}

export default async function PetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: session } = await auth.getSession();
  const user = session!.user;

  const pet = await getPetForUser(id, user.id);
  if (!pet) notFound();

  const [reports, { tasks }] = await Promise.all([
    listCareReportsForPet(pet.id),
    listTasksForPet(pet.id),
  ]);
  const orderedReports = [...reports].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 xl:max-w-[1760px]">
      <Link
        href="/pets"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Your pets
      </Link>

      <section className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <PetAvatar species={pet.species} photoUrl={pet.photo_url} className="size-20 sm:size-24" />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold">{pet.name}</h1>
            <p className="mt-1 text-muted-foreground">{petSummary(pet)}</p>
            {pet.location_label && (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                {pet.location_label}
              </p>
            )}
            {conditionList(pet.conditions).length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Health conditions">
                {conditionList(pet.conditions).map((condition) => (
                  <li
                    key={condition}
                    className="inline-flex items-center gap-1 rounded-full bg-health-soft px-2.5 py-0.5 text-xs font-semibold text-health"
                  >
                    <HeartPulse className="size-3.5" />
                    {condition}
                  </li>
                ))}
              </ul>
            )}
            {pet.notes && <p className="mt-3 max-w-2xl text-sm">{pet.notes}</p>}
            {pet.species === "raccoon" && (
              <p className="mt-3 flex max-w-2xl items-start gap-2 rounded-2xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-primary" />
                Keeping a raccoon is illegal in many US states and needs a permit in others. Check your state and
                local laws, and find an exotics vet who will see raccoons.
              </p>
            )}
          </div>
          <Link
            href={`/pets/${pet.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "pill", className: "self-start" })}
          >
            <Pencil />
            Edit
          </Link>
        </div>
        <div className="mt-6 border-t border-border pt-6">
          <GenerateCarePlanForm petId={pet.id} petName={pet.name} hasExistingReports={reports.length > 0} />
        </div>
      </section>

      {reports.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-3xl border-2 border-dashed border-border bg-card/60 px-6 py-12 text-center">
          <AnimalSilhouette species={pet.species} className="size-24 text-primary/30" />
          <h2 className="mt-4 text-xl font-semibold">No care plan yet</h2>
          <p className="mt-1 max-w-md text-muted-foreground">
            Generate one and five specialists will put together {pet.name}&apos;s diet, hygiene, health,
            insurance and supplies, usually in under a minute.
          </p>
        </div>
      ) : (
        <>
          <RoutineBanner petId={pet.id} tasks={tasks} />
          <section className="mt-8">
            <h2 className="text-2xl font-semibold">{pet.name}&apos;s care plan</h2>
            {/* Wide screens: the five specialists side by side. */}
            <div className="mt-4 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-5">
              {orderedReports.map((report) => (
                <CareReportCard key={report.category} report={report} pet={pet} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
