import { getDb } from './db';

// export async function runMigrations() {
//   const db = getDb();

//   // Create schema version table
//   await db.execAsync(`
//     CREATE TABLE IF NOT EXISTS schema_version (
//       version INTEGER
//     );
//   `);

//   const row = await db.getFirstAsync<{ version: number }>(
//     `SELECT version FROM schema_version LIMIT 1`
//   );

//   const currentVersion = row?.version ?? 0;

//   if (currentVersion < 1) {
//     await createInitialTables();
//     await db.execAsync(`
//       DELETE FROM schema_version;
//       INSERT INTO schema_version (version) VALUES (1);
//     `);
//   }
// }
export async function runMigrations() {
  const db = getDb();
  
  await db.execAsync(`CREATE TABLE IF NOT EXISTS schema_version (version INTEGER);`);
  const row = await db.getFirstAsync<{ version: number }>(`SELECT version FROM schema_version LIMIT 1`);
  let currentVersion = row?.version ?? 0;

  if (currentVersion < 1) {
    await createInitialTables();
    currentVersion = 1;
  }

  // Version 3: Catch ALL missing goal columns
  if (currentVersion < 3) {
    const columnsToAdd = [
      'ALTER TABLE goals ADD COLUMN goalType TEXT;',
      'ALTER TABLE goals ADD COLUMN measurementType TEXT;',
      'ALTER TABLE goals ADD COLUMN secondaryValue REAL;',
      'ALTER TABLE goals ADD COLUMN secondaryUnit TEXT;',
      'ALTER TABLE users ADD COLUMN isDirty INTEGER DEFAULT 0;'
    ];

    for (const sql of columnsToAdd) {
      try {
        await db.execAsync(sql);
      } catch (e) {
        // Ignore if column already exists
      }
    }
    currentVersion = 3;
  }

  await db.execAsync(`
    DELETE FROM schema_version;
    INSERT INTO schema_version (version) VALUES (${currentVersion});
  `);
}

async function createInitialTables() {
  const db = getDb();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      firstName TEXT,
      lastName TEXT,
      email TEXT,
      createdAt INTEGER,
      updatedAt INTEGER
    );
    
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT,
      exercise TEXT,
      startValue REAL,
      currentValue REAL,
      targetValue REAL,
      unit TEXT,
      completed INTEGER DEFAULT 0,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      date INTEGER
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      workoutId TEXT,
      name TEXT,
      category TEXT,
      FOREIGN KEY (workoutId) REFERENCES workouts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sets (
      id TEXT PRIMARY KEY,
      exerciseId TEXT,
      reps INTEGER,
      weight REAL,
      distance REAL,
      minutes INTEGER,
      seconds INTEGER,
      FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE CASCADE
    );
  `);
}