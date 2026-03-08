import { AppModal } from '@/components/AppModal';
import { getAll, getOne, run } from '@/database/db';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto'; // For generating history IDs
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

// --- Sub-Component for Set Rows to prevent JSX clutter ---
const SetRow = ({ set, index, isDone, onToggle, category }: any) => {
  const isWarmup = set.type === 'warmup';
  const isCardio = category?.toLowerCase() === 'cardio';

  // Format the middle column based on exercise type
  const renderDetails = () => {
    if (isCardio) {
      const dist = set.distance || '0';
      const mins = set.minutes || '0';
      const secs = (set.seconds || '0').toString().padStart(2, '0');
      return `${dist}mi / ${mins}:${secs}`;
    }
    // Default Strength/Core format
    return `${set.reps || 0} x ${set.weight || 0}lbs`;
  };

  return (
    <Pressable 
      style={[styles.setRow, isDone && styles.setRowDone]} 
      onPress={() => onToggle(set.id)}
    >
      {/* COL 1: SET NUMBER */}
      <View style={styles.colSet}>
        <Text style={styles.setText}>Set {index + 1}</Text>
      </View>

      {/* COL 2: TYPE BADGE */}
      <View style={styles.colType}>
        <View style={[
          styles.typeBadge, 
          { backgroundColor: isWarmup ? 'rgba(255, 167, 38, 0.15)' : 'rgba(76, 175, 80, 0.15)' }
        ]}>
          <Text style={[styles.typeText, { color: isWarmup ? '#FFA726' : '#4CAF50' }]}>
            {set.type.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* COL 3: DYNAMIC DETAILS */}
      <View style={styles.colDetails}>
        <Text style={styles.setDetails}>{renderDetails()}</Text>
      </View>

      {/* COL 4: CHECKMARK */}
      <View style={styles.colCheck}>
        <Ionicons 
          name={isDone ? "checkmark-circle" : "ellipse-outline"} 
          size={24} 
          color={isDone ? "#4CAF50" : "#555"} 
        />
      </View>
    </Pressable>
  );
};


export default function ActiveWorkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [workout, setWorkout] = useState<any>(null);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const hasStarted = Object.values(completedSets).some(val => val === true);


  // Modal States
  const [activeModal, setActiveModal] = useState<'reset' | 'cancel' | 'finish' | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const data = await getOne(`SELECT * FROM workouts WHERE id = ?`, [id]);
        const exercises = await getAll<any>(`SELECT * FROM exercises WHERE workoutId = ?`, [id]);
        for (let ex of exercises) {
          ex.sets = await getAll(`SELECT * FROM sets WHERE exerciseId = ?`, [ex.id]);
        }
        setWorkout({ ...data, exercises });
      } catch (e) { console.error(e); }
    };
    fetchWorkout();
  }, [id]);

  const formatTime = (s: number) => {
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${Math.floor(s / 3600) > 0 ? Math.floor(s / 3600) + ':' : ''}${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  const playConfettiAndExit = async () => {
    try {
      // Save to DB first
      await saveWorkoutToHistory();

      // Then show celebration
      setActiveModal(null);
      setShowConfetti(true);
      setIsActive(false);
      
      setTimeout(() => {
        setShowConfetti(false);
        router.replace('/(tabs)');
      }, 2500);
    } catch (e) {
      alert("Failed to save workout. Please try again.");
    }
  };

  const handleFinishPress = () => {
    // Calculate total sets in the workout template
    const totalSets = workout.exercises.reduce((acc: number, ex: any) => acc + ex.sets.length, 0);
    // Count how many sets are actually checked true
    const completedCount = Object.values(completedSets).filter(val => val).length;

    if (completedCount < totalSets) {
      setShowWarningModal(true);
    } else {
      setActiveModal('finish');
    }
  };


  const saveWorkoutToHistory = async () => {
    try {
      const historyId = Crypto.randomUUID();
      const now = Date.now();
      let totalVolume = 0;
      let totalDistance = 0;
      let totalReps = 0; // New counter

      workout.exercises.forEach((ex: any) => {
        ex.sets.forEach((set: any) => {
          if (completedSets[set.id]) {
            // 1. Always count reps if they exist
            const reps = Number(set.reps) || 0;
            totalReps += reps;

            // 2. Always count distance if it exists
            const distance = Number(set.distance) || 0;
            totalDistance += distance;

            // 3. Always count volume if weight exists
            const weight = Number(set.weight) || 0;
            totalVolume += (reps * weight);
            
            // Log for debugging hybrid sets
            if (distance > 0 && weight > 0) {
              console.log(`Hybrid set detected: ${distance}mi and ${reps}x${weight}lbs`);
            }
          }
        });
      });


      console.log(`Final Totals -> Vol: ${totalVolume}, Dist: ${totalDistance}, Reps: ${totalReps}`);

      // Update SQL to include totalReps
      await run(
        `INSERT INTO workout_history (id, workoutId, workoutTitle, duration, createdAt, totalVolume, totalDistance, totalReps) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [historyId, workout.id, workout.title, seconds, now, totalVolume, totalDistance, totalReps]
      );

      await run(`UPDATE workouts SET updatedAt = ? WHERE id = ?`, [now, workout.id]);
      
    } catch (error) {
      console.error("Error saving workout history:", error);
      throw error; 
    }
  };

  if (!workout) return null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerLeft: () => (
          <Pressable onPress={() => setActiveModal('cancel')} style={{ paddingHorizontal: 16 }}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
        ),
        title: 'Active Workout',
        headerTintColor: '#fff',
        headerStyle: { backgroundColor: '#121212' },
        gestureEnabled: false, 
      }} />

      <View style={styles.header}>
        <Pressable onPress={() => setActiveModal('reset')}><Ionicons name="refresh-outline" size={28} color="#fff" /></Pressable>
        <Text style={styles.timerText}>{formatTime(seconds)}</Text>
        <Pressable onPress={() => setIsActive(!isActive)}><Ionicons name={isActive ? "pause" : "play"} size={28} color="#4CAF50" /></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{workout.title}</Text>

        {/* Render Description/Note if it exists */}
        {workout.description && (
          <View style={styles.noteContainer}>
            <Ionicons name="document-text-outline" size={16} color="#aaa" />
            <Text style={styles.noteText}>{workout.description}</Text>
          </View>
        )}

        {workout.exercises.map((ex: any) => (
          <View key={ex.id} style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{ex.name}</Text>
            {ex.sets.map((set: any, index: number) => (
              <SetRow 
                key={set.id} 
                set={set} 
                index={index} 
                category={ex.category} 
                isDone={!!completedSets[set.id]} 
                onToggle={(sid: string) => setCompletedSets(p => ({ ...p, [sid]: !p[sid] }))} 
              />
            ))}
          </View>
        ))}
      </ScrollView>

      {!showConfetti && (
        <Pressable 
          style={[
            styles.finishButton, 
            !hasStarted && { opacity: 0.3 } // Fade out if not started
          ]} 
          onPress={handleFinishPress}
          disabled={!hasStarted} // Disable button interaction
        >
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </Pressable>
      )}


      {/* --- Consolidated Modals --- */}
      <AppModal 
        visible={activeModal === 'reset'} variant="danger" title="Reset Timer?" confirmText="Reset"
        onClose={() => setActiveModal(null)} onConfirm={() => { setSeconds(0); setActiveModal(null); }} 
      />
      <AppModal 
        visible={activeModal === 'cancel'} variant="danger" title="Cancel Workout? Progress will be lost." confirmText="End Session"
        onClose={() => setActiveModal(null)} onConfirm={() => router.back()} 
      />
      <AppModal 
        visible={activeModal === 'finish'} variant="success" title="Awesome work! Save this session?" confirmText="Finish"
        onClose={() => setActiveModal(null)} onConfirm={playConfettiAndExit} 
      />
      {/* Warning Modal for Unfinished Sets */}
      <AppModal 
        visible={showWarningModal} 
        variant="danger" 
        title="Unfinished Sets! Unchecked sets will not be recorded. Finish anyway?" 
        confirmText="Finish Anyway"
        cancelText="Go Back"
        onClose={() => setShowWarningModal(false)} 
        onConfirm={() => {
          setShowWarningModal(false);
          setActiveModal('finish'); // Proceed to the final confirmation
        }} 
      />


      {showConfetti && <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} fadeOut fallSpeed={2000} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#222' 
  },
  timerText: { color: '#fff', fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace' },
  scrollContent: { padding: 20 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  exerciseCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 15, marginBottom: 20 },
  exerciseName: { color: '#4CAF50', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  setRowDone: { opacity: 0.4 },
  colSet: { width: 60 },
  colDetails: { flex: 1, alignItems: 'center' },
  colCheck: { width: 40, alignItems: 'flex-end' },
  setText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  setDetails: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: 'monospace' },
  finishButton: { backgroundColor: '#4CAF50', margin: 20, padding: 18, borderRadius: 12, alignItems: 'center' },
  finishButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    colType: {
    width: 85, // Fixed column width
    alignItems: 'flex-start', // Keeps the badge aligned to the left of its column
    justifyContent: 'center',
  },
  typeBadge: {
    width: 65,                // FIXED WIDTH ensures no "extra padding" on the right
    height: 22,               // FIXED HEIGHT helps vertical centering
    borderRadius: 6,
    alignItems: 'center',     // Center text horizontally
    justifyContent: 'center',  // Center text vertically
  },
  typeText: {
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',      // Ensures text sits in the middle
    letterSpacing: 0.5,
    includeFontPadding: false, // Removes extra space on Android
  },
    noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'flex-start',
    borderLeftWidth: 3,
    // borderLeftColor: '#4CAF50', // Uses your theme green
  },
  noteText: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },

});
