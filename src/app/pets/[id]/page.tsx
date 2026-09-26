import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getPetForUser } from "@/lib/pets";
import { listCareReportsForPet, listTasksForPet } from "@/lib/care-reports";
import { CareReportCard } from "@/components/care-report-card";
import { GenerateCarePlanForm } from "@/components/generate-care-plan-form";

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

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 p-8">
      <h1 className="text-xl font-semibold">{pet.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {pet.species}
        {pet.breed ? ` · ${pet.breed}` : ""} · {pet.age_stage}
      </p>
      {pet.notes && <p className="mt-4 text-sm">{pet.notes}</p>}

      <div className="mt-6">
        <GenerateCarePlanForm petId={pet.id} hasExistingReports={reports.length > 0} />
      </div>

      {reports.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {reports.map((report) => (
            <CareReportCard key={report.category} report={report} />
          ))}
        </div>
      )}

      {tasks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Upcoming tasks</h2>
          <ul className="mt-3 divide-y divide-border rounded-md border border-border">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{task.task_name}</span>
                <span className="text-muted-foreground">
                  due {new Date(task.next_due).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
