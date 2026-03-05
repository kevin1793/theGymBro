import { getAll, getOne, run } from '@/database/db';

export type Goal = {
  id: string;
  title: string;
  exercise: string;
  startValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  completed: 0 | 1;
  createdAt: number;
  updatedAt: number;
  completedAt?: number | null;
  secondaryValue?: number | null;
  secondaryUnit?: string | null;
  goalType?: string | null;
  measurementType?: string | null;
};

// Get all active goals (not completed)
export async function getActiveGoals(): Promise<Goal[]> {
  return getAll<Goal>(`
    SELECT *
    FROM goals
    WHERE completed = 0
    ORDER BY createdAt DESC
  `);
}

// Get a single goal by ID
export async function getGoalById(id: string): Promise<Goal | null> {
  return getOne<Goal>(`SELECT * FROM goals WHERE id = ?`, [id]);
}

// Insert or update a goal
export async function saveGoal(goal: Goal) {
  const existing = await getGoalById(goal.id);

  if (existing) {
    // Update existing goal
    await run(
      `
      UPDATE goals
      SET title = ?, exercise = ?, startValue = ?, currentValue = ?, targetValue = ?, 
          unit = ?, completed = ?, updatedAt = ?, secondaryValue = ?, secondaryUnit = ?, goalType = ?, measurementType = ?
      WHERE id = ?
    `,
      [
        goal.title,
        goal.exercise,
        goal.startValue,
        goal.currentValue,
        goal.targetValue,
        goal.unit,
        goal.completed,
        Date.now(),
        goal.secondaryValue ?? null,
        goal.secondaryUnit ?? null,
        goal.goalType ?? null,
        goal.measurementType ?? null,
        goal.id,
      ]
    );
  } else {
    // Insert new goal
    await run(
      `
      INSERT INTO goals 
      (id, title, exercise, startValue, currentValue, targetValue, unit, completed, createdAt, updatedAt, secondaryValue, secondaryUnit, goalType, measurementType)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        goal.id,
        goal.title,
        goal.exercise,
        goal.startValue,
        goal.currentValue,
        goal.targetValue,
        goal.unit,
        goal.completed,
        Date.now(),
        Date.now(),
        goal.secondaryValue ?? null,
        goal.secondaryUnit ?? null,
        goal.goalType ?? null,
        goal.measurementType ?? null,
      ]
    );
  }
}

// Mark goal as completed
export async function completeGoal(id: string) {
  await run(`UPDATE goals SET completed = 1, updatedAt = ? WHERE id = ?`, [
    Date.now(),
    id,
  ]);
}

// Delete a goal
export async function deleteGoal(id: string) {
  await run(`DELETE FROM goals WHERE id = ?`, [id]);
}

export async function deleteBrokenGoals() {
  try {
    // This covers: 
    // 1. IS NULL
    // 2. Empty strings ''
    // 3. The literal string 'undefined' (if it was accidentally saved as a string)
    await run(`
      DELETE FROM goals 
      WHERE id IS NULL 
      OR id = '' 
      OR id = 'undefined' 
      OR id = 'null'
    `);
    console.log("Cleanup: Deleted all goals with invalid IDs.");
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
}