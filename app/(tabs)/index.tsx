import QuoteBanner from '@/components/QuoteBanner';
import ProgressTracker from '@/components/WeeklyTracker';
import { auth, db } from '@/lib/firebase';
import { formatTime } from '@/utils/helper';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoals } from '../context/GoalsContext';

type Workout = {
  id: string;
  title: string;
  description: string;
};

export default function Home() {
  const router = useRouter();
  const { goals, setGoals } = useGoals(); // get goals from context
  const goalList = Array.isArray(goals) ? goals : [];

  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // Fetch user first name
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFirstName(data.firstName || '');
        }

        // Fetch user's goals
        const goalsSnapshot = await getDocs(collection(db, 'users', uid, 'goals'));
        const goalsList = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGoals(goalsList.reverse()); // reverse to show newest first
        console.log('goalsList',goalsList)

        // Fetch user's workouts
        const workoutsSnapshot = await getDocs(collection(db, 'users', uid, 'workouts'));
        const workoutsList = workoutsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWorkouts(workoutsList);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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
          <Text style={styles.sectionTitle}>Goals</Text>
          <Pressable style={styles.plusButton} onPress={() => router.push('/goals/create')}>
            <Text style={styles.plusText}>+</Text>
          </Pressable>
        </View>

        {goalList.length === 0 ? (
  <Text style={styles.emptyText}>No goals yet my friend, try creating one!</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 30 }}>
              {goalList.map(goal => {
                let progressPercent = 0;

                if (goal.startValue != null && goal.currentValue != null && goal.targetValue != null) {
                  if (goal.startValue < goal.targetValue) {
                    // Higher is better (e.g., weight lifted)
                    const totalGain = goal.targetValue - goal.startValue;
                    const gained = goal.currentValue - goal.startValue;
                    progressPercent = totalGain > 0 ? Math.min((gained / totalGain) * 100, 100) : 0;
                  } else {
                    // Lower is better (e.g., mile time)
                    const totalReduction = goal.startValue - goal.targetValue;
                    const reduced = goal.startValue - goal.currentValue;
                    progressPercent = totalReduction > 0 ? Math.min((reduced / totalReduction) * 100, 100) : 0;
                  }
                }


                return (
                  <Pressable
                    key={goal.id}
                    style={styles.card}
                    onPress={() => router.push(`/goals/${goal.id}`)}
                  >
                    <Text style={styles.cardTitle}>{goal.title}</Text>
                    <Text style={styles.cardDescription}>Exercise: {goal.exercise}</Text>

                    {/* Only render weights if startValue exists */}
                    {goal.startValue !== undefined && (
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
          <Text style={styles.emptyText}>Workouts look empty, let's create some and get you jacked!...or lean!</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {workouts.map(workout => (
              <Pressable key={workout.id} style={styles.card} onPress={() => router.push('/workouts/view')}>
                <Text style={styles.cardTitle}>{workout.title}</Text>
                <Text style={styles.cardDescription}>{workout.description}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  header: { fontSize: 25, fontWeight: 'bold', marginBottom: 20, color: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 22, fontWeight: '600', color: '#fff' },
  plusButton: { width: 32, height: 32, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  plusText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  emptyText: { color: '#aaa', fontSize: 16, fontStyle: 'italic', marginVertical: 20 },
  card: { backgroundColor: '#1f1f1f', width: 220, borderRadius: 16, padding: 20, marginRight: 15 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
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
