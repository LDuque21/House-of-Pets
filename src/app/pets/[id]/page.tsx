import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, ChevronLeft, MapPin, Pencil } from "lucide-react";
import { auth } from "@/lib/auth/server";
import { getPetForUser } from "@/lib/pets";
import { listCareReportsForPet, listTasksForPet, type Task } from "@/lib/care-reports";
import { CareReportCard } from "@/components/care-report-card";
import { GenerateCarePlanForm } from "@/components/generate-care-plan-form";
import { AnimalSilhouette, PetAvatar } from "@/components/animal-silhouettes";
import { CATEGORY_META, CATEGORY_ORDER } from "@/components/category-meta";
import { buttonVariants } from "@/components/ui/button";
import { frequencyLabel, petSummary } from "@/lib/format";

// How often each routine happens -- deliberately no due dates.
function CareRoutine({ tasks }: { tasks: Task[] }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <CalendarCheck className="size-5 text-primary" />
        Care routine
      </h2>
      {tasks.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Feeding, grooming and checkup routines from the plan show up here.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {tasks.map((task) => {
            const { Icon, tint } = CATEGORY_META[task.category];
            return (
              <li key={task.id} className="flex items-center gap-3 rounded-2xl bg-background px-3 py-2.5">
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tint}`}>
                  <Icon className="size-4" />
                </span>
                <p className="min-w-0 flex-1 truncate font-semibold">{task.task_name}</p>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                  {frequencyLabel(task.frequency_days)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
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

  const [reports, tasks] = await Promise.all([
    listCareReportsForPet(pet.id),
    listTasksForPet(pet.id),
  ]);
  const orderedReports = [...reports].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
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
            {pet.notes && <p className="mt-3 max-w-2xl text-sm">{pet.notes}</p>}
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
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <h2 className="text-2xl font-semibold">{pet.name}&apos;s care plan</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {orderedReports.map((report) => (
                <CareReportCard key={report.category} report={report} pet={pet} />
              ))}
            </div>
          </section>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <CareRoutine tasks={tasks} />
          </aside>
        </div>
      )}
    </div>
  );
}
