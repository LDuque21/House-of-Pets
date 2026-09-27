"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, CalendarDays, Check, ChevronLeft, ChevronRight, LoaderCircle, Repeat } from "lucide-react";
import { completeTaskAction, setTaskLastDoneAction } from "@/app/pets/actions";
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
const isDaily = (task: Task) => task.frequency_days <= 1;

const DOT: Record<Category, string> = {
  diet: "bg-diet",
  hygiene: "bg-hygiene",
  health: "bg-health",
  insurance: "bg-insurance",
  materials: "bg-materials",
};
const CHIP: Record<Category, string> = {
  diet: "bg-diet-soft text-diet",
  hygiene: "bg-hygiene-soft text-hygiene",
  health: "bg-health-soft text-health",
  insurance: "bg-insurance-soft text-insurance",
  materials: "bg-materials-soft text-materials",
};

function dueLabel(task: Task): { text: string; className: string } {
  const n = task.due_in_days;
  if (n < 0) return { text: `Overdue ${-n} ${n === -1 ? "day" : "days"}`, className: "font-semibold text-destructive" };
  if (n === 0) return { text: "Due today", className: "font-semibold text-primary" };
  if (n === 1) return { text: "Due tomorrow", className: "" };
  if (n < 7) return { text: `Due in ${n} days`, className: "" };
  return { text: `Due ${shortDate(task.next_due)}`, className: "" };
}

function MarkDone({ task, today }: { task: Task; today: string }) {
  if (task.last_done_on === today) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
        <Check className="size-3.5" />
        Done today
      </span>
    );
  }
  return (
    <form action={completeTaskAction} className="shrink-0">
      <input type="hidden" name="task_id" value={task.id} />
      <SubmitButton
        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-semibold transition hover:border-primary hover:text-primary disabled:opacity-60"
        pendingLabel={<LoaderCircle className="size-3.5 animate-spin" />}
      >
        <Check className="size-3.5" />
        Done
      </SubmitButton>
    </form>
  );
}

// "Last done Sep 20 · change": lets the owner backdate a task so, say, a
// 90-day task they did last month isn't shown as due today.
function LastDone({ task, today }: { task: Task; today: string }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <form
        action={async (formData) => {
          await setTaskLastDoneAction(formData);
          setEditing(false);
        }}
        className="mt-2 flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="task_id" value={task.id} />
        <label className="flex items-center gap-2">
          Last done
          <input
            type="date"
            name="last_done_on"
            required
            max={today}
            defaultValue={task.last_done_on ?? today}
            className="rounded-lg border border-input bg-card px-2 py-1 text-xs text-foreground"
          />
        </label>
        <SubmitButton
          className="rounded-full bg-primary px-2.5 py-1 font-semibold text-primary-foreground disabled:opacity-60"
          pendingLabel="Saving…"
        >
          Save
        </SubmitButton>
        <button type="button" onClick={() => setEditing(false)} className="font-semibold hover:text-foreground">
          Cancel
        </button>
      </form>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "mt-1 text-left underline-offset-2 hover:text-foreground hover:underline",
        !task.last_done_on && "font-semibold text-primary"
      )}
    >
      {task.last_done_on ? `Last done ${shortDate(task.last_done_on)} · change` : "When did you last do this?"}
    </button>
  );
}

function TaskRow({ task, today }: { task: Task; today: string }) {
  const { Icon, tint } = CATEGORY_META[task.category];
  const due = dueLabel(task);
  return (
    <li
      className={cn(
        "rounded-2xl bg-background px-3 py-2.5",
        task.due_in_days < 0 && "ring-1 ring-destructive/40"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tint}`}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug break-words">{task.task_name}</p>
          <p className="text-xs text-muted-foreground">
            {frequencyLabel(task.frequency_days)}
            {!isDaily(task) && (
              <>
                {" · "}
                <span className={due.className}>{due.text}</span>
              </>
            )}
          </p>
        </div>
        <MarkDone task={task} today={today} />
      </div>
      {!isDaily(task) && (
        <div className="pl-12 text-xs text-muted-foreground">
          <LastDone task={task} today={today} />
        </div>
      )}
    </li>
  );
}

export function RoutineList({ tasks, today }: { tasks: Task[]; today: string }) {
  const daily = tasks.filter(isDaily);
  const scheduled = tasks.filter((t) => !isDaily(t)).sort((a, b) => a.due_in_days - b.due_in_days);
  const overdue = scheduled.filter((t) => t.due_in_days < 0).length;
  const dueToday = scheduled.filter((t) => t.due_in_days === 0).length;
  const neverDone = scheduled.filter((t) => !t.last_done_on).length;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <CalendarCheck className="size-5 text-primary" />
        Care routine
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {overdue > 0
          ? `${overdue} overdue${dueToday ? `, ${dueToday} due today` : ""}.`
          : dueToday > 0
            ? `${dueToday} due today.`
            : "All caught up."}{" "}
        {neverDone > 0 && "Tell us when you last did each task and we'll schedule the next one."}
      </p>

      {daily.length > 0 && (
        <>
          <p className="mt-5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <Repeat className="size-3.5" />
            Every day
          </p>
          <ul className="mt-2 space-y-2">
            {daily.map((task) => (
              <TaskRow key={task.id} task={task} today={today} />
            ))}
          </ul>
        </>
      )}
      {scheduled.length > 0 && (
        <>
          <p className="mt-5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <CalendarDays className="size-3.5" />
            Coming up
          </p>
          <ul className="mt-2 space-y-2">
            {scheduled.map((task) => (
              <TaskRow key={task.id} task={task} today={today} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

type CalendarEntry = { task: Task; kind: "due" | "overdue" | "done" };

// Every date in `month` (YYYY-MM) a non-daily task falls on, projected forward
// from its next due date (overdue tasks sit on today), plus each task's last
// completion so the owner can see what they've done.
function entriesInMonth(tasks: Task[], month: string, today: string): Map<string, CalendarEntry[]> {
  const start = toMs(`${month}-01`);
  const [y, m] = month.split("-").map(Number);
  const end = Date.UTC(y, m, 0);
  const byDate = new Map<string, CalendarEntry[]>();
  const add = (date: string, entry: CalendarEntry) => byDate.set(date, [...(byDate.get(date) ?? []), entry]);
  for (const task of tasks) {
    if (isDaily(task)) continue;
    if (task.last_done_on && task.last_done_on.startsWith(month)) add(task.last_done_on, { task, kind: "done" });
    const step = task.frequency_days * DAY_MS;
    const overdue = task.due_in_days < 0;
    let t = overdue ? toMs(today) : toMs(task.next_due);
    if (t < start) t += Math.ceil((start - t) / step) * step;
    for (let first = true; t <= end; t += step, first = false) {
      add(toDate(t), { task, kind: overdue && first && toDate(t) === today ? "overdue" : "due" });
    }
  }
  return byDate;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  return toDate(Date.UTC(y, m - 1 + delta, 1)).slice(0, 7);
}

export function RoutineCalendar({ tasks, today }: { tasks: Task[]; today: string }) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const byDate = useMemo(() => entriesInMonth(tasks, month, today), [tasks, month, today]);
  const daily = tasks.filter(isDaily);

  const first = new Date(toMs(`${month}-01`));
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const leading = first.getUTCDay();
  const monthLabel = first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const selectedEntries = selected.startsWith(month) ? (byDate.get(selected) ?? []) : [];

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <CalendarDays className="size-5 text-primary" />
          {monthLabel}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setMonth(today.slice(0, 7));
              setSelected(today);
            }}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:border-primary hover:text-primary"
          >
            Today
          </button>
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

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.7rem] font-bold uppercase text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <span key={d}>
            <span className="sm:hidden">{d[0]}</span>
            <span className="hidden sm:inline">{d}</span>
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leading }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`;
          const entries = byDate.get(date) ?? [];
          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelected(date)}
              aria-label={`${shortDate(date)}${entries.length ? `, ${entries.length} tasks` : ""}`}
              aria-pressed={selected === date}
              className={cn(
                "flex min-h-12 min-w-0 flex-col items-center gap-1 rounded-xl border border-transparent p-1 text-sm transition hover:bg-muted sm:min-h-24 sm:items-stretch sm:p-1.5 sm:text-left",
                date < today && "text-muted-foreground",
                selected === date && "border-primary/60 bg-secondary/60",
                date === today && "bg-secondary"
              )}
            >
              <span className={cn("text-xs sm:text-sm", date === today && "font-bold text-primary")}>{i + 1}</span>
              {/* Phones: colored dots. Wider screens: task names. */}
              <span className="flex flex-wrap justify-center gap-0.5 sm:hidden">
                {entries.slice(0, 3).map((e, j) => (
                  <span
                    key={j}
                    className={cn("size-1.5 rounded-full", e.kind === "done" ? "bg-muted-foreground/40" : DOT[e.task.category])}
                  />
                ))}
              </span>
              <span className="hidden flex-col gap-0.5 sm:flex">
                {entries.slice(0, 3).map((e, j) => (
                  <span
                    key={j}
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[0.7rem] leading-tight font-semibold break-words hyphens-auto",
                      e.kind === "done" ? "bg-muted text-muted-foreground line-through" : CHIP[e.task.category],
                      e.kind === "overdue" && "ring-1 ring-destructive"
                    )}
                  >
                    {e.task.task_name}
                  </span>
                ))}
                {entries.length > 3 && (
                  <span className="text-[0.7rem] text-muted-foreground">+{entries.length - 3} more</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 border-t border-border pt-4 text-sm">
        <p className="font-semibold">{selected === today ? "Today" : shortDate(selected)}</p>
        {selectedEntries.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {selectedEntries.map((e, j) => (
              <li key={j} className="flex items-center gap-2">
                <span
                  className={cn("size-2 shrink-0 rounded-full", e.kind === "done" ? "bg-muted-foreground/40" : DOT[e.task.category])}
                />
                <span className={cn(e.kind === "done" && "text-muted-foreground line-through")}>{e.task.task_name}</span>
                <span className="text-xs text-muted-foreground">
                  {e.kind === "done"
                    ? "done"
                    : e.kind === "overdue"
                      ? "overdue"
                      : frequencyLabel(e.task.frequency_days).toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-muted-foreground">Nothing scheduled beyond the daily routine.</p>
        )}
        {daily.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Not shown on the calendar, every day: {daily.map((t) => t.task_name.toLowerCase()).join(", ")}.
          </p>
        )}
      </div>
    </div>
  );
}
