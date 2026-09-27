import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth/server";
import { getPetForUser } from "@/lib/pets";
import { listTasksForPet } from "@/lib/care-reports";
import { RoutineCalendar, RoutineList } from "@/components/care-routine";
import { PetAvatar } from "@/components/animal-silhouettes";

// The pet's care routine on its own screen: tasks on the left (mark done, set
// when last done), the month calendar on the right.
export default async function RoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: session } = await auth.getSession();
  const pet = await getPetForUser(id, session!.user.id);
  if (!pet) notFound();

  const { tasks, today } = await listTasksForPet(pet.id);

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <Link
        href={`/pets/${pet.id}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {pet.name}&apos;s care plan
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <PetAvatar species={pet.species} photoUrl={pet.photo_url} className="size-14" />
        <div>
          <h1 className="text-3xl font-semibold">{pet.name}&apos;s routine</h1>
          <p className="text-muted-foreground">What to do, and when.</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-3xl border-2 border-dashed border-border bg-card/60 px-6 py-12 text-center">
          <CalendarCheck className="size-10 text-primary/40" />
          <h2 className="mt-4 text-xl font-semibold">No routine yet</h2>
          <p className="mt-1 max-w-md text-muted-foreground">
            Generate {pet.name}&apos;s care plan and the feeding, grooming and checkup routines show up here.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
          <RoutineList tasks={tasks} today={today} />
          <RoutineCalendar tasks={tasks} today={today} />
        </div>
      )}
    </div>
  );
}
