import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('workout_v2.db');

export const getDb = () => db;

export async function initDatabase() {
  // Use a single execAsync to define the full modern schema
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS workout_history (
      id TEXT PRIMARY KEY NOT NULL,
      workoutId TEXT,
      workoutTitle TEXT,
      duration INTEGER,
      createdAt INTEGER,
      totalVolume REAL,
      totalReps INTEGER DEFAULT 0,
      totalDistance REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY NOT NULL,
      firstName TEXT,
      lastName TEXT,
      email TEXT,
      username TEXT,
      createdAt INTEGER,
      updatedAt INTEGER,
      isDirty INTEGER DEFAULT 0
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
      updatedAt INTEGER,
      lastCompletedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS sets (
      id TEXT PRIMARY KEY NOT NULL,
      exerciseId TEXT,
      reps INTEGER,
      weight REAL,
      distance REAL,
      minutes INTEGER,
      seconds INTEGER,
      type TEXT
    );
  `);

  // Manual check for older installs that might be missing specific columns
  // This is safer than the loop to avoid locking the DB during login
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    -- Add this table!
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL,
      workoutId TEXT,
      name TEXT,
      orderIndex INTEGER,
      FOREIGN KEY(workoutId) REFERENCES workouts(id) ON DELETE CASCADE
    );

    -- Ensure your other tables (workout_history, users, goals, workouts, sets) are here...
  `);
  try { await db.execAsync("ALTER TABLE goals ADD COLUMN measurementType TEXT;"); } catch(e){}
  try { await db.execAsync("ALTER TABLE goals ADD COLUMN secondaryValue REAL;"); } catch(e){}
  try { await db.execAsync("ALTER TABLE goals ADD COLUMN secondaryUnit TEXT;"); } catch(e){}
  try { await db.execAsync("ALTER TABLE users ADD COLUMN username TEXT;"); } catch(e){}
  try { 
    await db.execAsync("ALTER TABLE workouts ADD COLUMN lastCompletedAt INTEGER;"); 
    console.log("Migration: Added lastCompletedAt to workouts");
  } catch(e) {
    // Column already exists, safe to ignore
  }
}

export async function run(query: string, params: any[] = []): Promise<void> {
  await db.runAsync(query, params);
}

export async function getAll<T = any>(query: string, params: any[] = []): Promise<T[]> {
  return await db.getAllAsync<T>(query, params);
}

export async function getOne<T = any>(query: string, params: any[] = []): Promise<T | null> {
  return await db.getFirstAsync<T>(query, params);
}

export const clearAllLocalData = async () => {
  // Use a transaction to ensure all tables are wiped together
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM workout_history`);
    await db.runAsync(`DELETE FROM goals`);
    await db.runAsync(`DELETE FROM workouts`);
    await db.runAsync(`DELETE FROM sets`);
    await db.runAsync(`DELETE FROM users`);
  });
};
