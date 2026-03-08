import { getAll, run } from '@/database/db';

export type Workout = {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  lastCompletedAt?: number | null;
  exercises?: Exercise[];
};

export type Exercise = {
  id: string;
  workoutId: string;
  name: string;
  sets?: Set[];
};

export type Set = {
  id: string;
  exerciseId: string;
  reps?: number;
  weight?: number;
  distance?: number;
  minutes?: number;
  seconds?: number;
  type: 'warmup' | 'working';
};

export async function deleteWorkout(id: string) {
  // First delete all sets for exercises belonging to this workout
  await run(
    `DELETE FROM sets WHERE exerciseId IN (SELECT id FROM exercises WHERE workoutId = ?)`,
    [id]
  );

  // Then delete all exercises belonging to this workout
  await run(`DELETE FROM exercises WHERE workoutId = ?`, [id]);

  // Finally delete the workout itself
  await run(`DELETE FROM workouts WHERE id = ?`, [id]);
}

export async function getWorkoutsWithRelations(): Promise<Workout[]> {
  const workouts = await getAll<Workout>(
    `SELECT * FROM workouts ORDER BY createdAt DESC`
  );

  for (const workout of workouts) {
    const exercises = await getAll<Exercise>(
      `SELECT * FROM exercises WHERE workoutId = ?`,
      [workout.id]
    );

    for (const exercise of exercises) {
      exercise.sets = await getAll<Set>(
        `SELECT * FROM sets WHERE exerciseId = ?`,
        [exercise.id]
      );
    }

    workout.exercises = exercises;
  }

  return workouts;
}

export const getWeeklyCompletions = async (startTimestamp: number) => {
  return await getAll(
    `SELECT createdAt FROM workout_history WHERE createdAt >= ?`,
    [startTimestamp]
  );
};

export async function deleteBrokenWorkouts() {
  try {
    // This covers: 
    // 1. IS NULL
    // 2. Empty strings ''
    // 3. The literal string 'undefined' (if it was accidentally saved as a string)
    await run(`
      DELETE FROM workouts 
      WHERE id IS NULL 
      OR id = '' 
      OR id = 'undefined' 
      OR createdAt = null
    `);
    console.log("Cleanup: Deleted all workouts with invalid IDs.");
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
}