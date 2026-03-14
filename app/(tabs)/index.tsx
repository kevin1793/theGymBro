import QuoteBanner from '@/components/QuoteBanner';
import ProgressTracker from '@/components/WeeklyTracker';
import { auth, db } from '@/lib/firebase';
import { deleteBrokenGoals, getActiveGoals } from '@/repositories/goalRepo';
import { getUser, saveUser } from '@/repositories/usersRepo';
import { deleteBrokenWorkouts, getWorkoutsWithRelations } from '@/repositories/workoutRepo';
import { formatTime } from '@/utils/helper';
import { useFocusEffect, useRouter } from 'expo-router';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoals } from '../../context/GoalsContext';
import { useWorkouts } from '../../context/WorkoutsContext';


type Workout = {
  id: string;
  title: string;
  description: string;
};

export default function Home() {
  const router = useRouter();
  const { goals, setGoals } = useGoals(); // get goals from context
  const { workouts,setWorkouts } = useWorkouts(); // get workouts from context
  const goalList = Array.isArray(goals) ? goals : [];

  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // const [workouts, setWorkouts] = useState<Workout[]>([]);

  const loadLocalData = useCallback(async () => {
    console.log('Dashboard - loadLocalData',)
    try {
      // Run cleanups
      await deleteBrokenGoals();
      await deleteBrokenWorkouts();

      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // Load goals
      const goalsList = await getActiveGoals();
      setGoals(goalsList);

      // Load workouts
      const workoutsList = await getWorkoutsWithRelations();
      setWorkouts(workoutsList);

      // Load user
      let user = await getUser(uid);
      if (!user) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          user = {
            uid,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: auth.currentUser?.email || '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await saveUser(user);
        }
      }
      if (user) setFirstName(user.firstName);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [setGoals, setWorkouts]);

  useFocusEffect(
    useCallback(() => {
      loadLocalData();
      const cleanup = async () => {
        await deleteBrokenGoals();
        await deleteBrokenWorkouts();
      };

      cleanup();
    }, [loadLocalData])
  );

  // 3. The "Master" Effect (Keep this one)
  // Inside Home.tsx - Replace your "Master Effect"
  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const setupData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // 1. Initial Local Load
      const goalsList = await getActiveGoals();
      const workoutsList = await getWorkoutsWithRelations();
      const localUser = await getUser(uid);

      if (isMounted) {
        setGoals(goalsList);
        setWorkouts(workoutsList);
        if (localUser) setFirstName(localUser.firstName);
        setLoading(false);
      }

      // 2. Real-time Firebase Listener
      const userDocRef = doc(db, 'users', uid);
      unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists() && isMounted) {
          const data = docSnap.data();
          const updatedName = data.firstName || '';
          
          // Update State immediately for UI snappiness
          setFirstName(updatedName);

          // Update Local Repository so it persists
          try {
            await saveUser({
              uid,
              firstName: updatedName,
              lastName: data.lastName || '',
              email: auth.currentUser?.email || '',
              createdAt: data.createdAt || Date.now(),
              updatedAt: Date.now(),
            });
          } catch (e) {
            console.log("Local save deferred");
          }
        }
      });
    };

    setupData();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [setGoals, setWorkouts]);



  const getGreeting = () => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    return firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.header}>{getGreeting()}</Text>
        <QuoteBanner />
        <ProgressTracker />

        {/* Goals Section */}
        <View style={styles.sectionHeader}>
          <Pressable onPress={() => router.push('/goals/list')}>
            <Text style={styles.sectionTitle}>Goals</Text>
          </Pressable>
          <Pressable style={styles.plusButton} onPress={() => router.push('/goals/create')}>
            <Text style={styles.plusText}>+</Text>
          </Pressable>
        </View>

        {goalList.length === 0 ? (
          <Text style={styles.emptyText}>No goals yet my friend, try creating one!</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 30 }}>
            {goalList.map(goal => {
              if (!goal) return null;
              let progressPercent = 0;

              if (goal.startValue != null && goal.currentValue != null && goal.targetValue != null) {
                if (goal.startValue < goal.targetValue) {
                  const totalGain = goal.targetValue - goal.startValue;
                  const gained = goal.currentValue - goal.startValue;
                  progressPercent = totalGain > 0 ? Math.min((gained / totalGain) * 100, 100) : 0;
                } else {
                  const totalReduction = goal.startValue - goal.targetValue;
                  const reduced = goal.startValue - goal.currentValue;
                  progressPercent = totalReduction > 0 ? Math.min((reduced / totalReduction) * 100, 100) : 0;
                }
              }

              return (
                <Pressable
                  key={goal.id || Math.random().toString()}
                  style={styles.card}
                  onPress={() => router.push(`/goals/${goal.id}`)}
                >
                  <Text style={styles.cardTitle}>{goal.title}</Text>
                  <Text style={styles.cardDescription}>Exercise: {goal.exercise}</Text>

                  {goal.startValue != null && (
                    <View style={styles.weightsRow}>
                      <View style={styles.weightColumn}>
                        <Text style={styles.weightLabel}>Starting</Text>
                        <Text style={styles.weightValue}>{formatTime(goal.startValue, goal.unit)}</Text>
                      </View>
                      <View style={styles.weightColumn}>
                        <Text style={styles.weightLabel}>Current</Text>
                        <Text style={styles.weightValue}>{formatTime(goal.currentValue, goal.unit)}</Text>
                      </View>
                      <View style={styles.weightColumn}>
                        <Text style={styles.weightLabel}>Goal</Text>
                        <Text style={styles.weightValue}>{formatTime(goal.targetValue, goal.unit)}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.progressRow}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{progressPercent.toFixed(0)}%</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Workouts Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Workouts</Text>
          <Pressable style={styles.plusButton} onPress={() => router.push('/workouts/create')}>
            <Text style={styles.plusText}>+</Text>
          </Pressable>
        </View>

        {workouts.length === 0 ? (
          <Text style={styles.emptyText}>
            Workouts look empty, let's create some and get you jacked!
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {workouts.map((workout) => {
              if (!workout) return null;

              let totalVolume = 0;
              let totalReps = 0;
              let totalDistance = 0;
              let totalTime = 0;

              // Safe iteration using optional chaining and defaults
              const exercises = workout.exercises || [];
              
              exercises.forEach((ex: any) => {
                const category = (ex?.category || 'strength').toLowerCase(); // Default to strength if missing
                const sets = ex?.sets || [];

                sets.forEach((set: any) => {
                  const reps = Number(set.reps || 0);
                  const weight = Number(set.weight || 0);
                  const distance = Number(set.distance || 0);
                  const minutes = Number(set.minutes || 0);
                  const seconds = Number(set.seconds || 0);
                  const time = minutes * 60 + seconds;

                  if (category === 'cardio') {
                    totalDistance += distance;
                    totalTime += time;
                  } else if (category === 'core') {
                    totalReps += reps;
                    totalTime += time;
                  } else {
                    // Default Strength logic
                    totalVolume += reps * weight;
                    totalReps += reps;
                  }
                });
              });

              const hours = Math.floor(totalTime / 3600);
              const minutesCount = Math.floor((totalTime % 3600) / 60);
              const secondsCount = totalTime % 60;
              const timeString = `${hours > 0 ? hours + 'h ' : ''}${minutesCount > 0 ? minutesCount + 'm ' : ''}${secondsCount}s`;

              return (
                <Pressable
                  key={workout.id || Math.random().toString()}
                  style={styles.card}
                  onPress={() => router.push(`/workouts/${workout.id}`)}
                >
                  <Text style={styles.workoutCardTitle}>{workout.title}</Text>
                  {workout.description ? (
                    <Text style={styles.cardDescription}>{workout.description}</Text>
                  ) : null}

                  {exercises.length > 0 && (
                    <>
                      <Text style={styles.cardInfo}>Exercises: {exercises.length}</Text>
                      <Text style={styles.cardInfo}>
                        Sets: {exercises.reduce((acc: number, ex: any) => acc + (ex.sets?.length || 0), 0)}
                      </Text>
                    </>
                  )}

                  {totalVolume > 0 && <Text style={styles.cardInfo}>Volume: {totalVolume} {workout.weightUnit || 'lbs'}</Text>}
                  {totalReps > 0 && <Text style={styles.cardInfo}>Reps: {totalReps}</Text>}
                  {totalDistance > 0 && <Text style={styles.cardInfo}>Distance: {totalDistance} {workout.distanceUnit || 'miles'}</Text>}
                  {totalTime > 0 && <Text style={styles.cardInfo}>Time: {timeString}</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );

}

const styles = StyleSheet.create({
  cardInfo: { fontSize: 12, color: '#aaa', marginBottom: 2 },

  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  header: { fontSize: 25, fontWeight: 'bold', marginBottom: 20, color: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 22, fontWeight: '600', color: '#fff' },
  plusButton: { width: 32, height: 32, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  plusText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  emptyText: { color: '#aaa', fontSize: 16, fontStyle: 'italic', marginVertical: 20 },
  card: { backgroundColor: '#1f1f1f', width: 220, borderRadius: 16, padding: 15, marginRight: 15 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  workoutCardTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardDescription: { fontSize: 14, color: '#aaa', marginBottom: 10 },
  weightsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  weightColumn: { alignItems: 'center' },
  weightLabel: { fontSize: 10, color: '#aaa', marginBottom: 2, fontWeight: '500' },
  weightValue: { fontSize: 12, color: '#fff', fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden', marginRight: 8 },
  progressFill: { height: '100%', backgroundColor: '#4ade80' },
  progressText: { color: '#fff', fontSize: 12, width: 40, textAlign: 'right' },
});