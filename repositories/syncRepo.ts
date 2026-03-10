import { getAll, getDb } from '@/database/db';
import { auth, db as firestore } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { getActiveGoals } from './goalRepo';
import { getWorkoutsWithRelations } from './workoutRepo';


export const syncLocalDataToCloud = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const batch = writeBatch(firestore);

  // 1. Sync Goals
  const localGoals = await getActiveGoals();
  localGoals.forEach((goal) => {
    const ref = doc(firestore, 'users', uid, 'goals', goal.id);
    batch.set(ref, { ...goal, updatedAt: Date.now() }, { merge: true });
  });

  // 2. Sync Workout Templates
  const localWorkouts = await getWorkoutsWithRelations();
  localWorkouts.forEach((workout) => {
    const ref = doc(firestore, 'users', uid, 'workouts', workout.id);
    batch.set(ref, { ...workout, updatedAt: Date.now() }, { merge: true });
  });

  // 3. Sync Workout History (Calendar)
  const history = await getAll(`SELECT * FROM workout_history`);
  history.forEach((h: any) => {
    const ref = doc(firestore, 'users', uid, 'history', h.id.toString());
    batch.set(ref, { 
      ...h, 
      totalReps: h.totalReps ?? 0,
      totalDistance: h.totalDistance ?? 0,
      syncDate: Date.now() 
    }, { merge: true });
  });

  await batch.commit();
};


/**
 * PULL ALL USER DATA (Array-based Hierarchy)
 * Syncs Goals, Workouts (with nested Exercise arrays), and History.
 */
export const pullAllUserData = async (uid: string) => {
  console.log("DEBUG: 🚀 Starting full pull for UID:", uid);
  const localDb = getDb(); 
  
  if (!localDb) {
    console.error("DEBUG ERROR: localDb instance is missing!");
    return;
  }

  try {
    // 1. Fetch Top-Level Collections from Firestore
    console.log("DEBUG: 📡 Fetching snapshots...");
    const [goalsSnap, workoutsSnap, historySnap] = await Promise.all([
      getDocs(collection(firestore, 'users', uid, 'goals')),
      getDocs(collection(firestore, 'users', uid, 'workouts')),
      getDocs(collection(firestore, 'users', uid, 'history'))
    ]);

    // --- A. SYNC GOALS (14 Columns) ---
    console.log(`DEBUG: 🎯 Processing ${goalsSnap.size} Goals...`);
    for (const goalDoc of goalsSnap.docs) {
      const g = goalDoc.data();
      await localDb.runAsync(
        `INSERT OR REPLACE INTO goals (
          id, title, exercise, startValue, currentValue, targetValue, 
          unit, completed, createdAt, updatedAt, goalType, 
          measurementType, secondaryValue, secondaryUnit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          String(goalDoc.id),
          String(g.title ?? ''),
          String(g.exercise ?? ''),
          Number(g.startValue ?? 0),
          Number(g.currentValue ?? 0),
          Number(g.targetValue ?? 0),
          String(g.unit ?? ''),
          g.completed ? 1 : 0,
          Number(g.createdAt ?? Date.now()),
          Number(g.updatedAt ?? Date.now()),
          String(g.goalType ?? ''),
          String(g.measurementType ?? ''),
          Number(g.secondaryValue ?? 0),
          String(g.secondaryUnit ?? '')
        ]
      );
    }

    // --- B. SYNC WORKOUTS + EXERCISES + SETS ---
    console.log(`DEBUG: 🏋️ Processing ${workoutsSnap.size} Workouts...`);
    for (const workoutDoc of workoutsSnap.docs) {
      const w = workoutDoc.data();
      console.log(`   [Workout] "${w.title}"`);

      // 1. Save Workout
      await localDb.runAsync(
        `INSERT OR REPLACE INTO workouts (id, title, description, createdAt, updatedAt, lastCompletedAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          String(workoutDoc.id), 
          String(w.title ?? ''), 
          String(w.description ?? ''), 
          Number(w.createdAt ?? Date.now()), 
          Number(w.updatedAt ?? Date.now()), 
          w.lastCompletedAt ? Number(w.lastCompletedAt) : null
        ]
      );

      // 2. Process Exercises from the array in the workout document
      const exercises = w.exercises || [];
      for (const ex of exercises) {
        const exId = String(ex.id || `${workoutDoc.id}_${ex.orderIndex}`);
        
        await localDb.runAsync(
          `INSERT OR REPLACE INTO exercises (id, workoutId, name, orderIndex) VALUES (?, ?, ?, ?)`,
          [exId, String(workoutDoc.id), String(ex.name ?? ''), Number(ex.orderIndex ?? 0)]
        );

        // 3. Process Sets from the array in the exercise
        const sets = ex.sets || [];
        for (let i = 0; i < sets.length; i++) {
          const s = sets[i];
          const setId = String(s.id || `${exId}_set_${i}`);
          
          await localDb.runAsync(
            `INSERT OR REPLACE INTO sets (id, exerciseId, reps, weight, distance, minutes, seconds, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              setId, 
              exId, 
              Number(s.reps ?? 0), 
              Number(s.weight ?? 0), 
              Number(s.distance ?? 0), 
              Number(s.minutes ?? 0), 
              Number(s.seconds ?? 0), 
              String(s.type ?? 'normal')
            ]
          );
        }
      }
    }

    // --- C. SYNC HISTORY ---
    console.log(`DEBUG: 📅 Processing ${historySnap.size} History items...`);
    for (const hDoc of historySnap.docs) {
      const h = hDoc.data();
      await localDb.runAsync(
        `INSERT OR REPLACE INTO workout_history (id, workoutId, workoutTitle, duration, createdAt, totalVolume, totalReps, totalDistance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          String(hDoc.id), 
          String(h.workoutId ?? ''), 
          String(h.workoutTitle ?? ''), 
          Number(h.duration ?? 0), 
          Number(h.createdAt ?? Date.now()), 
          Number(h.totalVolume ?? 0), 
          Number(h.totalReps ?? 0), 
          Number(h.totalDistance ?? 0)
        ]
      );
    }

    console.log("DEBUG: ✅ Sync Completed Successfully!");
  } catch (error) {
    console.error("DEBUG ❌ CRITICAL ERROR:", error);
    throw error;
  }
};
