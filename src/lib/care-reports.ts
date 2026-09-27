import { pool } from "@/lib/db";
import type { Category } from "@/lib/agents/schemas";
import { GEMINI_MODEL } from "@/lib/gemini";

export type CareReport = {
  id: string;
  pet_id: string;
  category: Category;
  generated_at: string;
  content: Record<string, unknown>;
  model: string;
  request: string | null;
};

export async function saveCareReport(
  petId: string,
  category: Category,
  content: object,
  request: string | null = null
): Promise<CareReport> {
  const { rows } = await pool.query<CareReport>(
    `INSERT INTO care_reports (pet_id, category, content, model, request)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [petId, category, JSON.stringify(content), GEMINI_MODEL, request]
  );
  return rows[0];
}

export async function listCareReportsForPet(petId: string): Promise<CareReport[]> {
  const { rows } = await pool.query<CareReport>(
    `SELECT DISTINCT ON (category) *
     FROM care_reports
     WHERE pet_id = $1
     ORDER BY category, generated_at DESC`,
    [petId]
  );
  return rows;
}

type DerivedTask = { task_name: string; frequency_days: number };

// The schemas ask for whole days, but guard anyway: tasks.frequency_days is an
// INTEGER column, so round (never below daily), and 0 means "not routinely
// needed" -- no task at all.
function wholeDays(value: unknown): number | null {
  if (typeof value !== "number" || !(value > 0)) return null;
  return Math.max(1, Math.round(value));
}

function deriveTasksForCategory(category: Category, content: Record<string, unknown>): DerivedTask[] {
  switch (category) {
    case "diet":
      return [{ task_name: "Feed", frequency_days: 1 }];
    case "hygiene": {
      const bathing = content.bathing as { frequency_days?: number } | undefined;
      const dental = content.dental_care as { frequency_days?: number } | undefined;
      const cleanup = content.cleanup as { frequency_days?: number } | undefined;
      const bathDays = wholeDays(bathing?.frequency_days);
      const dentalDays = wholeDays(dental?.frequency_days);
      const cleanupDays = wholeDays(cleanup?.frequency_days);
      const tasks: DerivedTask[] = [];
      if (bathDays) tasks.push({ task_name: "Bath", frequency_days: bathDays });
      if (dentalDays) tasks.push({ task_name: "Dental care", frequency_days: dentalDays });
      if (cleanupDays) tasks.push({ task_name: "Cleanup", frequency_days: cleanupDays });
      return tasks;
    }
    case "health": {
      const tasks: DerivedTask[] = [];
      const checkupDays = wholeDays(content.checkup_frequency_days);
      if (checkupDays) tasks.push({ task_name: "Vet checkup", frequency_days: checkupDays });
      for (const s of (content.screenings ?? []) as { name?: string; frequency_days?: number }[]) {
        const days = wholeDays(s.frequency_days);
        if (s.name && days) tasks.push({ task_name: s.name, frequency_days: days });
      }
      for (const cc of (content.condition_care ?? []) as { condition?: string; vet_followup_days?: number }[]) {
        const days = wholeDays(cc.vet_followup_days);
        if (cc.condition && days) {
          const name = cc.condition.charAt(0).toUpperCase() + cc.condition.slice(1);
          tasks.push({ task_name: `${name} vet follow-up`, frequency_days: days });
        }
      }
      return tasks;
    }
    case "insurance":
    case "materials":
      return [];
  }
}

// "Today" for due dates. Users and the demo are in the US, and the database
// clock is UTC, which would roll tasks over at 8pm Eastern. Per-user time
// zones would be the proper fix.
const TODAY = `(now() AT TIME ZONE 'America/New_York')::date`;

// Upserts by name so regenerating a plan keeps each task's completion history:
// a task done before stays scheduled from its last completion. New tasks start
// due today. Tasks the new plan no longer includes are removed.
export async function deriveAndSaveTasks(
  petId: string,
  category: Category,
  content: Record<string, unknown>
): Promise<void> {
  const byName = new Map(deriveTasksForCategory(category, content).map((t) => [t.task_name, t]));
  const tasks = [...byName.values()];

  for (const task of tasks) {
    await pool.query(
      `INSERT INTO tasks (pet_id, category, task_name, frequency_days, next_due)
       VALUES ($1, $2, $3, $4, ${TODAY})
       ON CONFLICT (pet_id, category, task_name) DO UPDATE
       SET frequency_days = EXCLUDED.frequency_days,
           next_due = COALESCE(tasks.last_done_on + EXCLUDED.frequency_days, tasks.next_due)`,
      [petId, category, task.task_name, task.frequency_days]
    );
  }
  await pool.query(
    `DELETE FROM tasks WHERE pet_id = $1 AND category = $2 AND NOT (task_name = ANY($3::text[]))`,
    [petId, category, tasks.map((t) => t.task_name)]
  );
}

export type Task = {
  id: string;
  pet_id: string;
  category: Category;
  task_name: string;
  frequency_days: number;
  next_due: string; // YYYY-MM-DD
  last_done_on: string | null; // YYYY-MM-DD
  due_in_days: number; // negative when overdue
};

// Dates come back as YYYY-MM-DD text so the server's time zone can't shift them.
export async function listTasksForPet(petId: string): Promise<{ tasks: Task[]; today: string }> {
  const { rows } = await pool.query<Task & { today: string }>(
    `SELECT id, pet_id, category, task_name, frequency_days,
            next_due::text AS next_due, last_done_on::text AS last_done_on,
            (next_due - ${TODAY}) AS due_in_days, ${TODAY}::text AS today
     FROM tasks WHERE pet_id = $1
     ORDER BY next_due ASC, frequency_days ASC, task_name ASC`,
    [petId]
  );
  const today = rows[0]?.today ?? (await pool.query<{ today: string }>(`SELECT ${TODAY}::text AS today`)).rows[0].today;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- dropping the per-row copy of today
  return { tasks: rows.map(({ today: _today, ...task }) => task), today };
}

// Marks a task done today and schedules the next one. Scoped to the owner.
export async function completeTaskForUser(taskId: string, userId: string): Promise<string | null> {
  const { rows } = await pool.query<{ pet_id: string }>(
    `UPDATE tasks t SET last_done_on = ${TODAY}, next_due = ${TODAY} + t.frequency_days
     FROM pets p
     WHERE t.id = $1 AND t.pet_id = p.id AND p.user_id = $2
     RETURNING t.pet_id`,
    [taskId, userId]
  );
  return rows[0]?.pet_id ?? null;
}

// Backdates a task ("I last did this on the 3rd") and schedules the next one
// from then. Refuses future dates and anything over ten years back.
export async function setTaskLastDoneForUser(taskId: string, userId: string, date: string): Promise<string | null> {
  const { rows } = await pool.query<{ pet_id: string }>(
    `UPDATE tasks t SET last_done_on = $3::date, next_due = $3::date + t.frequency_days
     FROM pets p
     WHERE t.id = $1 AND t.pet_id = p.id AND p.user_id = $2
       AND $3::date <= ${TODAY} AND $3::date > ${TODAY} - 3650
     RETURNING t.pet_id`,
    [taskId, userId, date]
  );
  return rows[0]?.pet_id ?? null;
}
