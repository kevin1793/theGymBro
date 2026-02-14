import QuoteBanner from '@/components/QuoteBanner';
import ProgressTracker from '@/components/WeeklyTracker';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


type Goal = {
  id: number;
  title: string;
  exercise: string;
  startingWeight: number;
  goalWeight: number;
  currentWeight: number;
};

type Workout = {
  id: number;
  title: string;
  description: string;
};

export default function Home() {
  const router = useRouter();

  // Demo data with startingWeight
  const goals: Goal[] = [
    { id: 1, title: 'Bench Press PR', exercise: 'Bench Press', startingWeight: 225, currentWeight: 275, goalWeight: 315 },
    { id: 2, title: 'Deadlift PR', exercise: 'Deadlift', startingWeight: 365, currentWeight: 405, goalWeight: 455 },
    { id: 3, title: 'Squat PR', exercise: 'Squat', startingWeight: 285, currentWeight: 325, goalWeight: 365 },
  ];

  const workouts: Workout[] = [
    { id: 1, title: 'Heavy Triples', description: 'Bench + Deadlifts' },
    { id: 2, title: 'Leg Day', description: 'Squats + Lunges + Calves' },
    { id: 3, title: 'Leg Day', description: 'Squats + Lunges + Calves' },
  ];

  function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        {/* <Text style={styles.header}>Dashboard</Text> */}
        <Text style={styles.header}>{getGreeting()}</Text>
        <QuoteBanner/>

        <ProgressTracker/>
        {/* Goals Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <Pressable
            style={styles.plusButton}
            onPress={() => router.push('/goals/create')}
          >
            <Text style={styles.plusText}>+</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 30 }}>
          {goals.map((goal) => {
            // Calculate progress based on starting weight
            const totalGain = goal.goalWeight - goal.startingWeight;
            const gained = goal.currentWeight - goal.startingWeight;
            const progressPercent = Math.min((gained / totalGain) * 100, 100);

            return (
              <Pressable
        key={goal.id}
        style={styles.card}
        onPress={() => router.push('/goals/view')}
      >
        <Text style={styles.cardTitle}>{goal.title}</Text>
        <Text style={styles.cardDescription}>Exercise: {goal.exercise}</Text>

        {/* Updated Weights Row */}
        <View style={styles.weightsRow}>
          <View style={styles.weightColumn}>
            <Text style={styles.weightLabel}>Starting</Text>
            <Text style={styles.weightValue}>{goal.startingWeight} lbs</Text>
          </View>
          <View style={styles.weightColumn}>
            <Text style={styles.weightLabel}>Current</Text>
            <Text style={styles.weightValue}>{goal.currentWeight} lbs</Text>
          </View>
          <View style={styles.weightColumn}>
            <Text style={styles.weightLabel}>Goal</Text>
            <Text style={styles.weightValue}>{goal.goalWeight} lbs</Text>
          </View>
        </View>

        {/* Progress bar row with percent */}
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

        {/* Workouts Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Workouts</Text>
          <Pressable
            style={styles.plusButton}
            onPress={() => router.push('/workouts/create')}
          >
            <Text style={styles.plusText}>+</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {workouts.map((workout) => (
            <Pressable
              key={workout.id}
              style={styles.card}
              onPress={() => router.push('/workouts/view')}
            >
              <Text style={styles.cardTitle}>{workout.title}</Text>
              <Text style={styles.cardDescription}>{workout.description}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  weightsRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 8,
},
weightColumn: {
  alignItems: 'center',
},
weightLabel: {
  fontSize: 10,
  color: '#aaa',
  marginBottom: 2,
  fontWeight: '500',
},
weightValue: {
  fontSize: 12,
  color: '#fff',
  fontWeight: '600',
},

  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 0,
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#1f1f1f',
    width: 220,
    borderRadius: 16,
    padding: 20,
    marginRight: 15,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 10,
  },
  weights: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weightText: {
    color: '#fff',
    fontSize: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ade80',
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
});
