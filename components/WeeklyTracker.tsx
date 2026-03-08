import { getAll } from '@/database/db'; // Your SQLite helper
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function WeeklyTracker() {
  const router = useRouter();
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  // --- Logic Constants (Keeping your exact math) ---
  const today = new Date();
  const todayIndex = today.getDay();
  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayAdjusted = todayIndex === 0 ? 6 : todayIndex - 1;

  const startOfWeek = new Date(today);
  startOfWeek.setHours(0, 0, 0, 0); // Start at midnight
  startOfWeek.setDate(today.getDate() - todayAdjusted);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;
  const weekRange = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;

  // --- Real Data Fetching ---
  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        try {
          // Query only workouts from this week
          const history = await getAll<{ createdAt: number }>(
            `SELECT createdAt FROM workout_history WHERE createdAt >= ?`,
            [startOfWeek.getTime()]
          );
          
          // Map timestamps to just the date number (e.g., 14, 15, 16)
          const days = history.map(h => new Date(h.createdAt).getDate());
          setCompletedDays(days);
        } catch (e) {
          console.error("Tracker fetch error:", e);
        }
      };
      fetchHistory();
    }, [])
  );

  return (
    <Pressable 
      style={styles.container} 
      onPress={() => router.push('/workouts/calendar')} // Navigates to month view
    >
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.header}>This Week</Text>
          <Ionicons name="chevron-forward" size={14} color="#aaa" />
        </View>
        <Text style={styles.dateRange}>{weekRange}</Text>
      </View>

      <View style={styles.weeklyContainer}>
        {dayOrder.map((day, index) => {
          // Get the actual date for this specific column
          const dayDate = new Date(startOfWeek);
          dayDate.setDate(startOfWeek.getDate() + index);
          const dayNumber = dayDate.getDate();

          // Check if today matches this date or if it was completed
          const isToday = index === todayAdjusted;
          const isCompleted = completedDays.includes(dayNumber);
          const isFuture = index > todayAdjusted;

          // Styles (Same as your original logic)
          const dotColor = isFuture ? '#333' : isCompleted ? '#4CAF50' : '#555';
          const labelColor = isFuture ? '#555' : '#aaa';

          return (
            <View key={day} style={styles.day}>
              <Text
                style={[
                  styles.dayLabel,
                  { 
                    color: labelColor, 
                    textDecorationLine: isToday ? 'underline' : 'none',
                    fontWeight: isToday ? 'bold' : 'normal' 
                  },
                ]}
              >
                {day} ({dayNumber})
              </Text>
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  header: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  dateRange: {
    color: '#aaa',
    fontSize: 12,
  },
  weeklyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  day: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 11,
    marginBottom: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
