// import { getDb } from '@/lib/db';

import { deleteWorkout } from '@/repositories/workoutRepo';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useWorkouts } from '../../context/WorkoutsContext';
import { getAll, getOne } from '../../database/db'; // Import the getOne function to fetch a single record from SQLite


type SetType = {
  id: string;
  type: 'warmup' | 'working';
  reps?: string;
  weight?: string;
  distance?: string;
  minutes?: string;
  seconds?: string;
};

type ExerciseType = {
  id: string;
  name: string;
  category: 'strength' | 'core' | 'cardio';
  sets: SetType[];
};

type WorkoutType = {
  id: string;
  title: string;
  description?: string;
  exercises: ExerciseType[];
  createdAt: number;
  completed?: boolean;
  completedAt?: number;
};

export default function WorkoutView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutType | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { removeWorkout } = useWorkouts();

  // const db = getDb();

  useEffect( () => {
    const fetchWorkout = async () => {
      if (!id) return;
        try {
          setLoading(true);
          // SQLite Query
          const data = await getOne<WorkoutType>(`SELECT * FROM workouts WHERE id = ?`, [id]);

          if (data) {
            // Fetch exercises for this workout
            const exercises: ExerciseType[] = await getAll<ExerciseType>(
              `SELECT * FROM exercises WHERE workoutId = ?`,
              [data.id]
            );

            // Fetch sets for each exercise
            for (let ex of exercises) {
              const sets: SetType[] = await getAll<SetType>(
                `SELECT * FROM sets WHERE exerciseId = ?`,
                [ex.id]
              );

              // Map sets to correct shape
              ex.sets = sets.map(set => ({
                ...set,
                reps: set.reps?.toString(),
                weight: set.weight?.toString(),
                distance: set.distance?.toString(),
                minutes: set.minutes?.toString(),
                seconds: set.seconds?.toString(),
                type: set.type || 'working',
              }));
            }

            // Set the workout state with nested exercises and sets
            setWorkout({
              ...data,
              exercises,
            });
            console.log('Fetched workout from SQLite:', data);
          } else {
            setWorkout(null);
          }
        } catch (error) {
          console.error('Error fetching workout from SQLite:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchWorkout();
    }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.notFoundText}>Workout not found.</Text>
      </View>
    );
  }

  // Totals
  let totalReps = 0;
  let totalVolume = 0;
  let totalDistance = 0;
  let totalTime = 0;

  workout.exercises.forEach(ex => {
    ex.sets.forEach(set => {
      const reps = parseInt(set.reps || '0');
      const weight = parseInt(set.weight || '0');
      const distance = parseInt(set.distance || '0');
      const minutes = parseInt(set.minutes || '0');
      const seconds = parseInt(set.seconds || '0');

      totalReps += reps;
      totalVolume += reps * weight;
      totalDistance += distance;
      totalTime += minutes * 60 + seconds;
    });
  });

  const formatHMS = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    let str = '';
    if (h > 0) str += `${h}h `;
    if (m > 0) str += `${m}m `;
    if (s > 0) str += `${s}s`;
    return str.trim() || '0s';
  };

  const userWeightUnit = 'lbs';
  const userDistanceUnit = 'miles';

const removeWorkoutKickOff = async () => {
  if (!workout?.id) return;

  try {
    await deleteWorkout(workout.id);

    // Refetch updated workouts
    // const updatedWorkouts = await getWorkoutsWithRelations();
    removeWorkout(workout.id); // update context
    // setWorkouts(updatedWorkouts); // update the state in your main page

    router.back();
  } catch (error) {
    console.error('Error deleting workout from SQLite:', error);
  }
};

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 16 }}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </Pressable>
          ),
          title: '',
          headerStyle: { backgroundColor: '#121212' },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{workout.title}</Text>
        {workout.description && <Text style={styles.subTitle}>{workout.description}</Text>}
        <Text style={styles.subTitle}>
          Created: {new Date(workout.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
        </Text>
        {workout.completedAt && (
          <Text style={styles.greenSubTitle}>
            Completed: {new Date(workout.completedAt).toLocaleDateString()}
          </Text>
        )}

        {workout.exercises.map(ex => (
          <View key={ex.id} style={styles.exerciseCard}>
            <Text style={styles.exerciseTitle}>{ex.name} ({ex.category})</Text>
            {ex.sets.map(set => (
              <View key={set.id} style={styles.setRow}>
                <Text style={styles.setInfo}>Type: {set.type}</Text>
                {set.reps && <Text style={styles.setInfo}>Reps: {set.reps}</Text>}
                {set.weight && <Text style={styles.setInfo}>Weight: {set.weight} {userWeightUnit}</Text>}
                {set.distance && <Text style={styles.setInfo}>Distance: {set.distance} {userDistanceUnit}</Text>}
                {(set.minutes || set.seconds) && (
                  <Text style={styles.setInfo}>
                    Time: {formatHMS((parseInt(set.minutes || '0') * 60) + parseInt(set.seconds || '0'))}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsRow}>
          <Text style={styles.totalText}>Total Volume: {totalVolume} {userWeightUnit}</Text>
          <Text style={styles.totalText}>Total Reps: {totalReps}</Text>
          {totalDistance > 0 && <Text style={styles.totalText}>Total Distance: {totalDistance} {userDistanceUnit}</Text>}
          {totalTime > 0 && <Text style={styles.totalText}>Total Time: {formatHMS(totalTime)}</Text>}
        </View>
      </ScrollView>

      {/* Trash at bottom */}
      <View style={styles.bottomBar}>
        <Pressable onPress={() => setDeleteVisible(true)} style={styles.trashButton}>
          <Ionicons name="trash-outline" size={26} color="#ff4444" />
        </Pressable>
      </View>

      {deleteVisible && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Delete Workout?</Text>
              <View style={styles.modalButtons}>
                <Pressable onPress={() => setDeleteVisible(false)}><Text style={styles.cancelText}>Cancel</Text></Pressable>
                <Pressable onPress={removeWorkoutKickOff}><Text style={styles.deleteConfirmText}>Delete</Text></Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showConfetti && (
        <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} fadeOut explosionSpeed={350} fallSpeed={3000} />
      )}
    </View>
  );
}

// Keep the same styles as before
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  notFoundText: { color: '#fff', fontSize: 18 },
  content: { padding: 20, paddingBottom: 140 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 10 },
  subTitle: { fontSize: 17, fontWeight: '500', color: '#aaa', marginBottom: 8 },
  greenSubTitle: { fontSize: 17, fontWeight: '500', color: '#4CAF50', marginBottom: 8 },
  exerciseCard: { backgroundColor: '#1f1f1f', padding: 16, borderRadius: 12, marginBottom: 16 },
  exerciseTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 10 },
  setRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  setInfo: { color: '#ccc', fontSize: 14 },
  totalsRow: { marginTop: 20 },
  totalText: { color: '#fff', fontSize: 16, marginBottom: 4 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1f1f1f', paddingVertical: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#333' },
  trashButton: { padding: 10 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: { width: '80%', backgroundColor: '#1f1f1f', padding: 24, borderRadius: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  cancelText: { color: '#aaa', fontSize: 16 },
  deleteConfirmText: { color: '#ff4444', fontSize: 16, fontWeight: '600' },
});