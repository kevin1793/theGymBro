import * as SQLite from 'expo-sqlite';

// Open the database synchronously so 'db' is available immediately
const db = SQLite.openDatabaseSync('workout.db');

export const getDb = () => db; 


export async function initDatabase() {
  // execAsync is perfect for schema creation
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS workout_history (
      id TEXT PRIMARY KEY NOT NULL,
      workoutId TEXT,
      workoutTitle TEXT,
      duration INTEGER, -- Total seconds from your timer
      createdAt INTEGER, -- The timestamp for the calendar
      totalVolume REAL,
      FOREIGN KEY(workoutId) REFERENCES workouts(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY NOT NULL,
      firstName TEXT,
      lastName TEXT,
      email TEXT,
      createdAt INTEGER,
      isDirty INTEGER DEFAULT 0,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT,
      exercise TEXT,
      startValue REAL,
      currentValue REAL,
      targetValue REAL,
      unit TEXT,
      completed INTEGER DEFAULT 0,
      createdAt INTEGER,
      updatedAt INTEGER,
      goalType TEXT,
      measurementType TEXT,
      secondaryValue REAL,
      secondaryUnit TEXT
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT,
      description TEXT,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS sets (
      id TEXT PRIMARY KEY NOT NULL,
      exerciseId TEXT,
      reps INTEGER,
      weight REAL,
      distance REAL,
      minutes INTEGER,
      seconds INTEGER,
      type TEXT,
      FOREIGN KEY(exerciseId) REFERENCES exercises(id) ON DELETE CASCADE
    );
    
  `);
  try {
    await db.execAsync(`ALTER TABLE workout_history ADD COLUMN totalReps INTEGER DEFAULT 0;`);
    console.log("Migration: Added 'totalReps' to workout_history.");
  } catch (e) {
    console.log("'totalReps' column already exists, skipping migration.");
  }
  try {
    // Check if the column exists by attempting to add it
    // SQLite will throw an error if it already exists, which we catch safely
    await db.execAsync(`ALTER TABLE workout_history ADD COLUMN totalDistance REAL DEFAULT 0;`);
    console.log("Migration: Added 'totalDistance' to workout_history.");
  } catch (e) {
    console.log("'totalDistance' column already exists or table doesn't exist yet, skipping.");
  }

  try {
    await db.execAsync(`ALTER TABLE users ADD COLUMN isDirty INTEGER DEFAULT 0;`);
    console.log("Migration: Added isDirty column to users.");
  } catch (e) {
    // If the column already exists, SQLite will throw an error. We safely ignore it.
  }

  try {
    await db.execAsync(`ALTER TABLE sets ADD COLUMN type TEXT;`);
    console.log("Migration: Added 'type' column to sets table.");
  } catch (e) {
    console.log("Column 'type' already exists, skipping migration.");
  }

  try {
    await db.execAsync(`ALTER TABLE workouts ADD COLUMN createdAt INTEGER;`);
    await db.execAsync(`ALTER TABLE workouts ADD COLUMN updatedAt INTEGER;`);
    await db.execAsync(`ALTER TABLE workouts ADD COLUMN lastCompletedAt INTEGER;`);
    console.log('Migration: Added createdAt/updatedAt to workouts.');
  } catch (e) {
    // ignore errors if column already exists
  }
  
}

// export async function run(query: string, params: any[] = []): Promise<void> {
//   await db.runAsync(query, params);
// }

export async function getAll<T = any>(query: string, params: any[] = []): Promise<T[]> {
  return await db.getAllAsync<T>(query, params);
}

// export async function getOne<T = any>(query: string, params: any[] = []): Promise<T | null> {
//   return await db.getFirstAsync<T>(query, params);
// }

export async function getOne<T = any>(query: string, params: any[] = []): Promise<T | null> {
  try {
    // getFirstAsync is the built-in Expo method for fetching a single row
    const result = await db.getFirstAsync<T>(query, params);
    return result;
  } catch (error) {
    console.error("SQL getOne Error:", error);
    return null;
  }
}
export async function run(query: string, params: any[] = []): Promise<void> {
  await db.runAsync(query, params);
}

export const clearWorkoutHistory = async () => {
  try {
    await run(`DELETE FROM workout_history`, []);
    console.log("Workout history cleared successfully.");
  } catch (error) {
    console.error("Error clearing workout history:", error);
    throw error;
  }
};