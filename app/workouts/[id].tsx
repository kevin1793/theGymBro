// import { getDb } from '@/lib/db';

import { deleteWorkout } from '@/repositories/workoutRepo';
import { formatHMS } from '@/utils/helper';
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
          title: 'Workout',
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
        
        {workout.exercises.map(ex => {
          // Determine if the exercise is a core type
          const isCore = (category: string) => category.toLowerCase() === 'core';

          // Determine if the exercise is cardio
          const isCardio = (category: string) => category.toLowerCase() === 'cardio';

          // Determine if the exercise is strength (anything not core or cardio)
          const isStrength = (category: string) => !isCore(category) && !isCardio(category);
          const showStrength = isStrength(ex.category);
          const showCore = isCore(ex.category);
          const showCardio = isCardio(ex.category);

          return (
            <View key={ex.id} style={styles.exerciseCard}>
              <Text style={styles.exerciseTitle}>{ex.name} ({ex.category})</Text>

              {/* Grid Header */}
              <View style={[styles.setRow, { backgroundColor: '#222', paddingVertical: 4 }]}>
                <Text style={[styles.setInfo, styles.setHeader]}>Type</Text>
                {showStrength && <Text style={[styles.setInfo, styles.setHeader]}>Reps</Text>}
                {showStrength && <Text style={[styles.setInfo, styles.setHeader]}>Weight</Text>}
                {showCardio && <Text style={[styles.setInfo, styles.setHeader]}>Distance</Text>}
                {(showCore || showCardio) && <Text style={[styles.setInfo, styles.setHeader]}>Time</Text>}
              </View>

              {/* Sets */}
              {ex.sets.map(set => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setInfo}>{set.type}</Text>
                  {showStrength && <Text style={styles.setInfo}>{set.reps || '-'}</Text>}
                  {showStrength && <Text style={styles.setInfo}>{set.weight ? `${set.weight} ${userWeightUnit}` : '-'}</Text>}
                  {showCardio && <Text style={styles.setInfo}>{set.distance ? `${set.distance} ${userDistanceUnit}` : '-'}</Text>}
                  {(showCore || showCardio) && (
                    <Text style={styles.setInfo}>
                      {(set.minutes || set.seconds)
                        ? formatHMS((parseInt(set.minutes || '0') * 60) + parseInt(set.seconds || '0'))
                        : '-'}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          );
        })}

        {/* Totals */}
        <View style={styles.totalsRow}>
          {totalVolume > 0 && <Text style={styles.totalText}>Total Volume: {totalVolume} {userWeightUnit}</Text>}
          {totalReps > 0 && <Text style={styles.totalText}>Total Reps: {totalReps}</Text>}
          {totalDistance > 0 && <Text style={styles.totalText}>Total Distance: {totalDistance} {userDistanceUnit}</Text>}
          {totalTime > 0 && <Text style={styles.totalText}>Total Time: {formatHMS(totalTime)}</Text>}
        </View>
        
        <Pressable
          style={styles.completeButton}
          onPress={() => router.push(`/workouts/active/${id}`)}
        >
          <Text style={styles.completeText}>Start Workout</Text>
        </Pressable>

      </ScrollView>

      {/* Trash at bottom */}
      <View style={styles.bottomBar}>
        <Pressable onPress={() => setDeleteVisible(true)} style={styles.trashButton}>
          <Ionicons name="trash-outline" size={26} color="#ff4444" />
        </Pressable>
        <Pressable onPress={() => router.replace(`/workouts/create?id=${workout?.id}`)}  style={styles.trashButton}>
          <Ionicons name="create-outline" size={26} color="#4CAF50" />
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
  totalsRow: { marginTop: 20 },
  totalText: { color: '#fff', fontSize: 16, marginBottom: 4 },
  trashButton: { padding: 10 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: { width: '80%', backgroundColor: '#1f1f1f', padding: 24, borderRadius: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  cancelText: { color: '#aaa', fontSize: 16 },
  deleteConfirmText: { color: '#ff4444', fontSize: 16, fontWeight: '600' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1f1f1f',
    paddingVertical: 20,
    paddingHorizontal: 40, // add some horizontal padding
    flexDirection: 'row',
    justifyContent: 'space-between', // space between the buttons
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  bottomButton: {
    padding: 10,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  setInfo: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
  },
  setHeader: {
    fontWeight: 'bold',
    color: '#ccc',
  },
  completeButton: {
    marginTop: 60,
    // backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 25,
    borderColor: '#4CAF50',
    borderWidth: 1,
    // width: '20%',
    paddingHorizontal: 30,
    // margin:'0 auto',
    alignItems: 'center',
    alignSelf: 'center'
  },

  completeText: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: 16,
  },

});