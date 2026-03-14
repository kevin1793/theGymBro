import { AppModal } from '@/components/AppModal';
import { clearWorkoutHistory, getAll } from '@/database/db';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function WorkoutCalendar() {
  const [history, setHistory] = useState<any[]>([]);
  const [markedDates, setMarkedDates] = useState({});
  const [showClearModal, setShowClearModal] = useState(false);
  
  // Track the visible month (defaults to current month "YYYY-MM")
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().split('-').slice(0, 2).join('-'));

  const handleClearAll = async () => {
    await clearWorkoutHistory();
    setShowClearModal(false);
    router.replace('/(tabs)'); 
  };

  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        const data = await getAll(`SELECT * FROM workout_history ORDER BY createdAt DESC`);
        setHistory(data);

        const marks: any = {};
        data.forEach((h: any) => {
          const dateStr = new Date(h.createdAt).toISOString().split('T')[0];
          marks[dateStr] = { marked: true, dotColor: '#4CAF50' };
        });
        setMarkedDates(marks);
      };
      loadHistory();
    }, [])
  );

  // Filter stats based on the visible month
  const stats = useMemo(() => {
    let totalVol = 0;
    let totalDist = 0;
    let totalReps = 0;
    let count = 0;

    history.forEach((h: any) => {
      const workoutDate = new Date(h.createdAt).toISOString().split('-').slice(0, 2).join('-');
      
      // Only sum data if it matches the month shown on the calendar
      if (workoutDate === currentMonth) {
        count++;
        totalVol += (h.totalVolume || 0);
        totalDist += (h.totalDistance || 0);
        totalReps += (h.totalReps || 0); 
      }
    });

    return {
      count,
      volume: totalVol,
      distance: totalDist,
      reps: totalReps,
    };
  }, [history, currentMonth]); // Re-run when history OR month changes

  const formatDuration = (sec: number) => `${Math.floor(sec / 60)}m ${sec % 60}s`;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerLeft: () => (
          <Pressable onPress={() => router.replace('/(tabs)')} style={{ paddingHorizontal: 16 }}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
        ),
        title: 'Calendar',
        headerTintColor: '#fff',
        headerStyle: { backgroundColor: '#121212' },
        gestureEnabled: false, 
      }} />

      <FlatList
        data={history.slice(0, 10)} 
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <Calendar
              theme={{
                calendarBackground: '#1f1f1f',
                dayTextColor: '#fff',
                todayTextColor: '#4CAF50',
                monthTextColor: '#fff',
                arrowColor: '#4CAF50',
                textDisabledColor: '#444',
                dotColor: '#4CAF50',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12,
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '700',
                textSectionTitleColor: '#888', 
              }}
              markedDates={markedDates}
              style={styles.calendar}
              // Update the state whenever the user swipes or arrows to a new month
              onMonthChange={(month) => {
                setCurrentMonth(month.dateString.split('-').slice(0, 2).join('-'));
              }}
            />

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>WORKOUTS</Text>
                <Text style={styles.statValue}>{stats.count}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>TOTAL LBS</Text>
                <Text style={styles.statValue}>{stats.volume.toLocaleString()}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>DISTANCE</Text>
                <Text style={styles.statValue}>{stats.distance.toFixed(1)}mi</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>TOTAL REPS</Text>
                <Text style={styles.statValue}>{stats.reps.toLocaleString()}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <View>
              <Text style={styles.historyTitle}>{item.workoutTitle}</Text>
              <Text style={styles.historySub}>{new Date(item.createdAt).toLocaleDateString()} • {formatDuration(item.duration)}</Text>
            </View>
            <Text style={styles.historyVol}>
              {[
                item.totalVolume > 0 ? `${item.totalVolume.toLocaleString()} lbs` : null,
                item.totalDistance > 0 ? `${item.totalDistance.toFixed(1)} mi` : null,
                item.totalReps > 0 ? `${item.totalReps.toLocaleString()} reps` : null
              ].filter(Boolean).join(' • ')}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <Pressable onPress={() => setShowClearModal(true)} style={styles.dangerButton}>
            <Text style={{ color: '#ff4444', textAlign: 'center', marginVertical: 20 }}>Clear All History</Text>
          </Pressable>
        }
      />

      <AppModal
        visible={showClearModal}
        variant="danger"
        title="Clear All History?"
        confirmText="Clear Everything"
        cancelText="Keep My Data"
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearAll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  calendar: { borderRadius: 12, margin: 16, backgroundColor: '#1f1f1f' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 16, marginBottom: 12 },
  historyCard: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1a1a1a', padding: 16, marginHorizontal: 16, marginBottom: 10, borderRadius: 12 
  },
  historyTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  historySub: { color: '#777', fontSize: 12, marginTop: 4 },
  historyVol: { color: '#4CAF50', fontWeight: 'bold', fontSize: 13 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  statItem: {
    backgroundColor: '#1f1f1f',
    padding: 12,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dangerButton: {
    marginTop: 10,
    padding: 10,
  }
});
