import { auth, db } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Goal = {
  id: string;
  title: string;
  exercise: string;
  goalType: string;
  measurementType: string;
  unit: string;
  startValue: number;
  currentValue: number;
  targetValue: number;
  secondaryValue?: number | null;
  secondaryUnit?: string | null;
};

export default function GoalView() {
  const router = useRouter();
  const { goalId } = useSearchParams<{ goalId: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoal = async () => {
      if (!goalId) return;
      try {
        const user = auth.currentUser;
        if (!user) return;

        const goalDoc = await getDoc(doc(db, 'users', user.uid, 'goals', goalId));
        if (goalDoc.exists()) {
          setGoal({ id: goalDoc.id, ...(goalDoc.data() as Goal) });
        }
      } catch (error) {
        console.log('Error fetching goal:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoal();
  }, [goalId]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#4CAF50" />;
  if (!goal) return <Text style={{ color: '#fff', marginTop: 50, textAlign: 'center' }}>Goal not found</Text>;

  const totalGain = goal.targetValue - goal.startValue;
  const gained = goal.currentValue - goal.startValue;
  const progressPercent = totalGain > 0 ? Math.min((gained / totalGain) * 100, 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>{goal.title}</Text>
        <Text style={styles.subTitle}>Exercise: {goal.exercise}</Text>
        <Text style={styles.subTitle}>Goal Type: {goal.goalType}</Text>

        <View style={styles.weightsRow}>
          <View style={styles.weightColumn}>
            <Text style={styles.weightLabel}>Starting</Text>
            <Text style={styles.weightValue}>{goal.startValue} {goal.unit}</Text>
          </View>
          <View style={styles.weightColumn}>
            <Text style={styles.weightLabel}>Current</Text>
            <Text style={styles.weightValue}>{goal.currentValue} {goal.unit}</Text>
          </View>
          <View style={styles.weightColumn}>
            <Text style={styles.weightLabel}>Goal</Text>
            <Text style={styles.weightValue}>{goal.targetValue} {goal.unit}</Text>
          </View>
        </View>

        {goal.secondaryValue != null && (
          <Text style={styles.secondary}>Secondary Value: {goal.secondaryValue} {goal.secondaryUnit}</Text>
        )}

        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressPercent.toFixed(0)}%</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 10 },
  subTitle: { fontSize: 18, fontWeight: '500', color: '#aaa', marginBottom: 8 },
  weightsRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
  weightColumn: { alignItems: 'center' },
  weightLabel: { fontSize: 12, color: '#aaa', marginBottom: 2 },
  weightValue: { fontSize: 14, color: '#fff', fontWeight: '600' },
  secondary: { fontSize: 14, color: '#fff', marginBottom: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  progressBar: { flex: 1, height: 8, backgroundColor: '#333', borderRadius: 4, overflow: 'hidden', marginRight: 8 },
  progressFill: { height: '100%', backgroundColor: '#4CAF50' },
  progressText: { color: '#fff', fontSize: 14, width: 50, textAlign: 'right' },
});
