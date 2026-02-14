import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Dummy weekly data
const weeklyWorkouts = [
  { day: 'Mon', completed: 1 },
  { day: 'Tue', completed: 0 },
  { day: 'Wed', completed: 1 },
  { day: 'Thu', completed: 1 },
  { day: 'Fri', completed: 0 },
  { day: 'Sat', completed: 1 },
  { day: 'Sun', completed: 0 },
];

export default function WeeklyTracker() {
  const today = new Date();

  // Get current day index: 0=Sun, 1=Mon ... 6=Sat
  const todayIndex = today.getDay();

  // Map dayOrder to match our weeklyWorkouts: 0=Mon ... 6=Sun
  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayAdjusted = todayIndex === 0 ? 6 : todayIndex - 1;

  // Calculate start of week
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - todayAdjusted);

  // Calculate week range for header
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;
  const weekRange = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;

  // Function to get the date number for a day
  const getDayNumber = (dayIndex: number) => {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + dayIndex);
    return dayDate.getDate();
  };

  return (
    <View style={styles.container}>
      {/* Header with week range */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>This Week</Text>
        <Text style={styles.dateRange}>{weekRange}</Text>
      </View>

      {/* Weekly progress */}
      <View style={styles.weeklyContainer}>
        {weeklyWorkouts.map((w, index) => {
          const dayJSIndex = dayOrder.indexOf(w.day);
          const isFuture = dayJSIndex > todayAdjusted;

          const dotColor = isFuture ? '#333' : w.completed ? '#4CAF50' : '#555';
          const labelColor = isFuture ? '#555' : '#aaa';

          const isToday = dayJSIndex === todayAdjusted;

          // Get day number
          const dayNumber = getDayNumber(dayJSIndex);

          return (
            <View key={w.day} style={styles.day}>
              <Text
                style={[
                  styles.dayLabel,
                  { color: labelColor, textDecorationLine: isToday ? 'underline' : 'none' },
                ]}
              >
                {w.day} ({dayNumber})
              </Text>
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
            </View>
          );
        })}
      </View>
    </View>
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
    marginBottom: 8,
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
    fontSize: 12,
    marginBottom: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
