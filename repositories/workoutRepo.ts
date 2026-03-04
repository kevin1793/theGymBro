import { getAll } from '@/database/db';

export async function getWorkoutsWithRelations() {
  const workouts = await getAll(`SELECT * FROM workouts ORDER BY date DESC`);

  for (const workout of workouts) {
    const exercises = await getAll(
      `SELECT * FROM exercises WHERE workoutId = ?`,
      [workout.id]
    );

    for (const ex of exercises) {
      const sets = await getAll(
        `SELECT * FROM sets WHERE exerciseId = ?`,
        [ex.id]
      );
      ex.sets = sets;
    }

    workout.exercises = exercises;
  }

  return workouts;
}

// CREATE TABLE workouts (
//   id TEXT PRIMARY KEY,
//   title TEXT,
//   description TEXT,
//   date INTEGER
// );

// CREATE TABLE workouts (
//   id TEXT PRIMARY KEY,
//   title TEXT,
//   description TEXT,
//   date INTEGER
// );

// CREATE TABLE sets (
//   id TEXT PRIMARY KEY,
//   exerciseId TEXT,
//   reps INTEGER,
//   weight REAL,
//   distance REAL,
//   minutes INTEGER,
//   seconds INTEGER
// );