"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, CalendarDays, Check, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { completeTaskAction } from "@/app/pets/actions";
import { CATEGORY_META } from "@/components/category-meta";
import { SubmitButton } from "@/components/submit-button";
import type { Category } from "@/lib/agents/schemas";
import type { Task } from "@/lib/care-reports";
import { frequencyLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

// Dates are YYYY-MM-DD strings from the database, handled as UTC midnights so
// the viewer's time zone can't shift a day.
const DAY_MS = 86_400_000;
const toMs = (date: string) => Date.parse(`${date}T00:00:00Z`);
const toDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const shortDate = (date: string) =>
  new Date(toMs(date)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const DOT: Record<Category, string> = {
  diet: "bg-diet",
  hygiene: "bg-hygiene",
  health: "bg-health",
  insurance: "bg-insurance",
  materials: "bg-materials",
};

function dueLabel(task: Task): { text: string; className: string } {
  const n = task.due_in_days;
  if (n < 0) return { text: `Overdue ${-n} ${n === -1 ? "day" : "days"}`, className: "font-semibold text-destructive" };
  if (n === 0) return { text: "Due today", className: "font-semibold text-primary" };
  if (n === 1) return { text: "Due tomorrow", className: "" };
  if (n < 7) return { text: `Due in ${n} days`, className: "" };
  return { text: `Due ${shortDate(task.next_due)}`, className: "" };
}

function TaskRow({ task, today }: { task: Task; today: string }) {
  const { Icon, tint } = CATEGORY_META[task.category];
  const due = dueLabel(task);
  const doneToday = task.last_done_on === today;
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-background px-3 py-2.5",
        task.due_in_days < 0 && "ring-1 ring-destructive/40"
      )}
    >
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tint}`}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{task.task_name}</p>
        <p className="text-xs text-muted-foreground">
          {frequencyLabel(task.frequency_days)} · <span className={due.className}>{due.text}</span>
        </p>
      </div>
      {doneToday && task.due_in_days > 0 ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
          <Check className="size-3.5" />
          Done
        </span>
      ) : (
        <form action={completeTaskAction} className="shrink-0">
          <input type="hidden" name="task_id" value={task.id} />
          <SubmitButton
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-semibold transition hover:border-primary hover:text-primary disabled:opacity-60"
            pendingLabel={<LoaderCircle className="size-3.5 animate-spin" />}
          >
            <Check className="size-3.5" />
            Mark done
          </SubmitButton>
        </form>
      )}
    </li>
  );
}

// Every date in `month` (YYYY-MM) that a non-daily task falls on, projected
// forward from its next due date. Overdue tasks count as due today.
function occurrencesInMonth(tasks: Task[], month: string, today: string): Map<string, Task[]> {
  const start = toMs(`${month}-01`);
  const [y, m] = month.split("-").map(Number);
  const end = Date.UTC(y, m, 0); // last day of the month
  const byDate = new Map<string, Task[]>();
  for (const task of tasks) {
    if (task.frequency_days <= 1) continue;
    const step = task.frequency_days * DAY_MS;
    let t = task.due_in_days < 0 ? toMs(today) : toMs(task.next_due);
    if (t < start) t += Math.ceil((start - t) / step) * step;
    for (; t <= end; t += step) {
      const date = toDate(t);
      byDate.set(date, [...(byDate.get(date) ?? []), task]);
    }
  }
  return byDate;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  return toDate(Date.UTC(y, m - 1 + delta, 1)).slice(0, 7);
}

function Calendar({ tasks, today }: { tasks: Task[]; today: string }) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const byDate = useMemo(() => occurrencesInMonth(tasks, month, today), [tasks, month, today]);
  const daily = tasks.filter((t) => t.frequency_days <= 1);

  const first = new Date(toMs(`${month}-01`));
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const leading = first.getUTCDay();
  const monthLabel = first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const selectedTasks = byDate.get(selected) ?? [];
  const selectedInMonth = selected.startsWith(month);

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <CalendarDays className="size-5 text-primary" />
          {monthLabel}
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, -1))}
            aria-label="Previous month"
            className="grid size-8 place-items-center rounded-full hover:bg-muted"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, 1))}
            aria-label="Next month"
            className="grid size-8 place-items-center rounded-full hover:bg-muted"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-[0.7rem] font-bold uppercase text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leading }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`;
          const due = byDate.get(date) ?? [];
          const categories = [...new Set(due.map((t) => t.category))];
          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelected(date)}
              aria-label={`${shortDate(date)}${due.length ? `, ${due.length} due` : ""}`}
              aria-pressed={selected === date}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition hover:bg-muted",
                date === today && "font-bold text-primary ring-2 ring-primary/50",
                selected === date && "bg-secondary text-secondary-foreground",
                date < today && "text-muted-foreground"
              )}
            >
              {i + 1}
              <span className="mt-0.5 flex h-1.5 gap-0.5">
                {categories.slice(0, 3).map((c) => (
                  <span key={c} className={`size-1.5 rounded-full ${DOT[c]}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-border pt-4 text-sm">
        <p className="font-semibold">{selected === today ? "Today" : shortDate(selected)}</p>
        {selectedInMonth && selectedTasks.length > 0 ? (
          <ul className="mt-1.5 space-y-1">
            {selectedTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <span className={`size-2 shrink-0 rounded-full ${DOT[t.category]}`} />
                {t.task_name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-muted-foreground">Nothing scheduled beyond the daily routine.</p>
        )}
        {daily.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Every day: {daily.map((t) => t.task_name.toLowerCase()).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

export function CareRoutine({ tasks, today }: { tasks: Task[]; today: string }) {
  const overdue = tasks.filter((t) => t.due_in_days < 0).length;
  const dueToday = tasks.filter((t) => t.due_in_days === 0).length;
  return (
    <div className="space-y-6">
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
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              {overdue > 0
                ? `${overdue} overdue${dueToday ? `, ${dueToday} due today` : ""}.`
                : dueToday > 0
                  ? `${dueToday} due today.`
                  : "All caught up."}{" "}
              Mark tasks done and we&apos;ll schedule the next one.
            </p>
            <ul className="mt-4 space-y-2">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} today={today} />
              ))}
            </ul>
          </>
        )}
      </div>
      {tasks.length > 0 && <Calendar tasks={tasks} today={today} />}
    </div>
  );
}
