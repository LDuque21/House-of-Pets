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
};

export async function saveCareReport(
  petId: string,
  category: Category,
  content: object
): Promise<CareReport> {
  const { rows } = await pool.query<CareReport>(
    `INSERT INTO care_reports (pet_id, category, content, model)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [petId, category, JSON.stringify(content), GEMINI_MODEL]
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
      const days = wholeDays(content.checkup_frequency_days);
      return days ? [{ task_name: "Vet checkup", frequency_days: days }] : [];
    }
    case "insurance":
    case "materials":
      return [];
  }
}

export async function deriveAndSaveTasks(
  petId: string,
  category: Category,
  content: Record<string, unknown>
): Promise<void> {
  const tasks = deriveTasksForCategory(category, content);

  await pool.query(`DELETE FROM tasks WHERE pet_id = $1 AND category = $2`, [petId, category]);

  for (const task of tasks) {
    await pool.query(
      `INSERT INTO tasks (pet_id, category, task_name, frequency_days, next_due)
       VALUES ($1, $2, $3, $4, CURRENT_DATE + make_interval(days => $4))`,
      [petId, category, task.task_name, task.frequency_days]
    );
  }
}

export type Task = {
  id: string;
  pet_id: string;
  category: Category;
  task_name: string;
  frequency_days: number;
  next_due: string;
};

export async function listTasksForPet(petId: string): Promise<Task[]> {
  const { rows } = await pool.query<Task>(
    `SELECT * FROM tasks WHERE pet_id = $1 ORDER BY frequency_days ASC, task_name ASC`,
    [petId]
  );
  return rows;
}
