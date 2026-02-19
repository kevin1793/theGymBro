import { auth, db } from '@/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
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

type SetType = {
  id: string;
  type: 'warmup' | 'working';
  reps?: number;
  weight?: number;
  distance?: number;
  minutes?: number;
  seconds?: number;
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
  createdAt: any;
  completed?: boolean;
  completedAt?: any;
};

export default function WorkoutView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!id) return;
      try {
        const user = auth.currentUser;
        if (!user) return;

        const workoutDoc = await getDoc(doc(db, 'users', user.uid, 'workouts', id));
        if (workoutDoc.exists()) {
          const data = workoutDoc.data() as WorkoutType;
          setWorkout({ id: workoutDoc.id, ...data });
        } else {
          setWorkout(null);
        }
      } catch (error) {
        console.error('Error fetching workout:', error);
        setWorkout(null);
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

  const completeWorkout = async () => {
    if (!workout) return;
    try {
      const user = auth.currentUser;
      if (!user) return;

      const updatedWorkout = { ...workout, completed: true, completedAt: new Date() };
      setWorkout(updatedWorkout);
      await updateDoc(doc(db, 'users', user.uid, 'workouts', workout.id), updatedWorkout);

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    } catch (error) {
      console.error('Error completing workout:', error);
    }
  };

  const undoCompleteWorkout = async () => {
    if (!workout) return;
    try {
      const user = auth.currentUser;
      if (!user) return;
      const updatedWorkout = { ...workout, completed: false, completedAt: null };
      setWorkout(updatedWorkout);
      await updateDoc(doc(db, 'users', user.uid, 'workouts', workout.id), updatedWorkout);
    } catch (error) {
      console.error('Error undoing completion:', error);
    }
  };

  const removeWorkout = async () => {
    if (!workout) return;
    try {
      const user = auth.currentUser;
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.uid, 'workouts', workout.id));
      router.back();
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  // Totals
  let totalReps = 0;
  let totalVolume = 0;
  let totalDistance = 0;
  let totalTime = 0;
  workout.exercises.forEach(ex => {
    ex.sets.forEach(set => {
      totalReps += typeof set.reps === 'string' ? (parseInt(set.reps) || 0) : set.reps || 0;
      totalVolume += (set.reps || 0) * (set.weight || 0);
      totalDistance += set.distance || 0;
      totalTime += ((set.minutes || 0) * 60 + (set.seconds || 0));
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
        {workout.description ? <Text style={styles.subTitle}>{workout.description}</Text> : null}
        <Text style={styles.subTitle}>
          Created: {workout.createdAt?.seconds ? new Date(workout.createdAt.seconds*1000).toLocaleDateString() : '—'}
        </Text>
        {workout.completedAt && <Text style={styles.greenSubTitle}>Completed: {new Date(workout.completedAt.seconds*1000).toLocaleDateString()}</Text>}

        {workout.exercises.map(ex => (
          <View key={ex.id} style={styles.exerciseCard}>
            <Text style={styles.exerciseTitle}>{ex.name} ({ex.category})</Text>
            {ex.sets.map(set => (
              <View key={set.id} style={styles.setRow}>
                {set.reps != null && <Text style={styles.setInfo}>Reps: {set.reps}</Text>}
                {set.weight != null && <Text style={styles.setInfo}>Weight: {set.weight} {userWeightUnit}</Text>}
                {set.distance != null && <Text style={styles.setInfo}>Distance: {set.distance} {userDistanceUnit}</Text>}
                {(set.minutes != null || set.seconds != null) && <Text style={styles.setInfo}>Time: {formatHMS((set.minutes||0)*60 + (set.seconds||0))}</Text>}
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

        {/* Complete / Undo */}
        {!workout.completed ? (
          <Pressable style={styles.completeButton} onPress={completeWorkout}>
            <Text style={styles.completeText}>Complete Workout</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.completeButton, styles.undoButton]} onPress={undoCompleteWorkout}>
            <Text style={styles.undoText}>Undo Completion</Text>
          </Pressable>
        )}
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
                <Pressable onPress={removeWorkout}><Text style={styles.deleteConfirmText}>Delete</Text></Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showConfetti && <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} fadeOut explosionSpeed={350} fallSpeed={3000} />}
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
  setRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  setInfo: { color: '#ccc', fontSize: 14 },
  totalsRow: { marginTop: 20 },
  totalText: { color: '#fff', fontSize: 16, marginBottom: 4 },
  completeButton: { marginTop: 30, borderColor: '#4CAF50', borderWidth: 1, paddingVertical: 14, paddingHorizontal: 30, borderRadius: 25, alignItems: 'center', alignSelf: 'center' },
  completeText: { color: '#4CAF50', fontWeight: '700', fontSize: 16 },
  undoButton: { borderColor: '#EF5350', backgroundColor: 'transparent', marginTop: 30 },
  undoText: { color: '#EF5350', fontWeight: '700', fontSize: 16 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1f1f1f', paddingVertical: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#333' },
  trashButton: { padding: 10 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: { width: '80%', backgroundColor: '#1f1f1f', padding: 24, borderRadius: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  cancelText: { color: '#aaa', fontSize: 16 },
  deleteConfirmText: { color: '#ff4444', fontSize: 16, fontWeight: '600' },
});
