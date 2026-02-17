import { auth, db } from '@/lib/firebase';
import { formatTime } from '@/utils/helper'; // helper to format time units
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';


type Goal = {
  id: string;
  title: string;
  exercise: string;
  unit: string;
  startValue: number;
  currentValue: number;
  targetValue: number;
  completed?: boolean;
  completedAt?: any;
};

export default function GoalsList() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const fetchGoals = async () => {
  //     try {
  //       const uid = auth.currentUser?.uid;
  //       if (!uid) return;

  //       const snapshot = await getDocs(collection(db, 'users', uid, 'goals'));
  //       const goalsList = snapshot.docs.map(doc => ({
  //         id: doc.id,
  //         ...doc.data(),
  //       })) as Goal[];

  //       // Sort newest first
  //       setGoals(goalsList.reverse());
  //     } catch (error) {
  //       console.error('Error fetching goals:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchGoals();
  // }, []);

  useFocusEffect(
  useCallback(() => {
    let isActive = true; // flag to avoid setting state if unmounted

    const fetchGoals = async () => {
      try {
        setLoading(true);
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const snapshot = await getDocs(collection(db, 'users', uid, 'goals'));
        const goalsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Goal[];

        if (isActive) {
          setGoals(goalsList.reverse());
        }
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchGoals();

    return () => {
      isActive = false; // cleanup
    };
  }, [])
);


  const activeGoals = goals.filter(goal => !goal.completed);
  const completedGoals = goals.filter(goal => goal.completed);

  const calculateProgress = (goal: Goal) => {
    let progressPercent = 0;

    if (goal.startValue < goal.targetValue) {
      const totalGain = goal.targetValue - goal.startValue;
      const gained = goal.currentValue - goal.startValue;
      progressPercent = totalGain > 0 ? Math.min((gained / totalGain) * 100, 100) : 0;
    } else {
      const totalReduction = goal.startValue - goal.targetValue;
      const reduced = goal.startValue - goal.currentValue;
      progressPercent = totalReduction > 0 ? Math.min((reduced / totalReduction) * 100, 100) : 0;
    }

    return progressPercent;
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
      options={{
        headerLeft: () => (
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back(); // normal push stack
              } else {
                router.push('/'); // fallback if JS stack is empty
              }
            }}
            style={{ paddingHorizontal: 16 }}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
        ),
        title: '',
        headerBackTitle: '',
        headerBackTitleVisible: false,
        headerTintColor: '#fff',
        headerStyle: { backgroundColor: '#121212' },
      }}
    />
      {/* <SafeAreaView style={styles.container}> */}
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.header}>Your Goals</Text>

          {/* ACTIVE GOALS */}
          <Text style={styles.sectionTitle}>Active</Text>

          {activeGoals.length === 0 ? (
            <Text style={styles.empty}>No active goals.</Text>
          ) : (
            activeGoals.map(goal => {
              const progress = calculateProgress(goal);

              return (
                <Pressable
                  key={goal.id}
                  style={styles.card}
                  onPress={() => router.push(`/goals/${goal.id}`)}
                >
                  {/* Top Row */}
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={styles.cardTitle}>{goal.title}</Text>
                      <Text style={styles.cardSubtitle}>{goal.exercise}</Text>
                    </View>

                    {goal.createdAt && (
                      <Text style={styles.dateText}>
                        Started: {new Date(goal.createdAt.seconds * 1000).toLocaleDateString()}
                      </Text>
                    )}
                  </View>

                  {/* Values Row */}
                  <View style={styles.valuesRow}>
                    <View style={styles.valueBlock}>
                      <Text style={styles.valueLabel}>Starting</Text>
                      <Text style={styles.valueText}>
                        {formatTime(goal.startValue, goal.unit)}
                      </Text>
                    </View>

                    <View style={styles.valueBlock}>
                      <Text style={styles.valueLabel}>Current</Text>
                      <Text style={styles.valueText}>
                        {formatTime(goal.currentValue, goal.unit)}
                      </Text>
                    </View>

                    <View style={styles.valueBlock}>
                      <Text style={styles.valueLabel}>Target</Text>
                      <Text style={styles.valueText}>
                        {formatTime(goal.targetValue, goal.unit)}
                      </Text>
                    </View>
                  </View>

                  {/* Progress */}
                  <View style={styles.progressRow}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progress}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {progress.toFixed(0)}%
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}

          {/* COMPLETED GOALS */}
          <Text style={[styles.sectionTitle, { marginTop: 40 }]}>
            Completed
          </Text>

          {completedGoals.length === 0 ? (
            <Text style={styles.empty}>No completed goals yet.</Text>
          ) : (
            completedGoals.map(goal => (
              <Pressable
                key={goal.id}
                style={[styles.card, styles.completedCard]}
                onPress={() => router.push(`/goals/${goal.id}`)}
              >
                <View style={styles.topRow}>
                  {/* Left: Title + Exercise */}
                  <View style={styles.leftColumn}>
                    <Text style={styles.cardTitle}>{goal.title}</Text>
                    <Text style={styles.cardSubtitle}>{goal.exercise}</Text>
                  </View>

                  {/* Right: Started + Completed + Target */}
                  {(goal.createdAt && goal.completedAt) && (
                    <View style={styles.rightColumn}>
                      <View style={styles.dateHeaderRow}>
                        <Text style={styles.dateLabel}>Started</Text>
                        <Text style={styles.completedDateLabel}>Completed</Text>
                        <Text style={styles.targetLabel}>Target</Text>
                      </View>

                      <View style={styles.dateValueRow}>
                        <Text style={styles.dateValue}>
                          {new Date(goal.createdAt.seconds * 1000).toLocaleDateString()}
                        </Text>
                        <Text style={styles.dateValue}>
                          {new Date(goal.completedAt.seconds * 1000).toLocaleDateString()}
                        </Text>
                        <Text style={styles.dateValue}>
                          {formatTime(goal.targetValue, goal.unit)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      {/* </SafeAreaView> */}
    </View>
  );
}


// styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },

  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 15,
  },

  empty: {
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#1f1f1f',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
  },

  completedCard: {
    borderColor: '#4CAF50',
    borderWidth: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },

  cardSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 6,
  },

  /* Active goal styles */
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  valuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  valueBlock: {
    alignItems: 'center',
  },

  valueLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },

  valueText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginRight: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },

  progressText: {
    color: '#fff',
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },

  dateText: {
    color: '#888',
    fontSize: 13,
  },

  /* Completed layout */
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  leftColumn: {
    flex: 1,
    paddingRight: 10,
  },

  rightColumn: {
    alignItems: 'flex-end',
  },
  dateValue: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },

  /* Target display */
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  targetValue: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  // 
  dateHeaderRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: 220, // wider to fit three items
},

dateValueRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: 220, // match header
  marginTop: 4,
},

dateLabel: {
  fontSize: 12,
  color: '#777',
  fontWeight: '600',
},

completedDateLabel: {
  fontSize: 12,
  color: '#4CAF50',
  fontWeight: '600',
},

targetLabel: {
  fontSize: 12,
  color: '#f1f2f2',
},



});

