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

function deriveTasksForCategory(category: Category, content: Record<string, unknown>): DerivedTask[] {
  switch (category) {
    case "diet":
      return [{ task_name: "Feed", frequency_days: 1 }];
    case "hygiene": {
      const bathing = content.bathing as { frequency_days?: number } | undefined;
      const dental = content.dental_care as { frequency_days?: number } | undefined;
      const cleanup = content.cleanup as { frequency_days?: number } | undefined;
      const tasks: DerivedTask[] = [];
      if (bathing?.frequency_days) tasks.push({ task_name: "Bath", frequency_days: bathing.frequency_days });
      if (dental?.frequency_days)
        tasks.push({ task_name: "Brush teeth", frequency_days: dental.frequency_days });
      if (cleanup?.frequency_days)
        tasks.push({ task_name: "Litter box / cleanup", frequency_days: cleanup.frequency_days });
      return tasks;
    }
    case "health": {
      const days = content.checkup_frequency_days as number | undefined;
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
    `SELECT * FROM tasks WHERE pet_id = $1 ORDER BY next_due ASC`,
    [petId]
  );
  return rows;
}
