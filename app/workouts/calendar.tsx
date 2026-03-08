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

  const handleClearAll = async () => {
    await clearWorkoutHistory();
    setShowClearModal(false);
    // Optional: Refresh your state or redirect
    router.replace('/(tabs)'); 
  };

  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        const data = await getAll(`SELECT * FROM workout_history ORDER BY createdAt DESC`);
        setHistory(data);
        console.log('Workout History Data',data)

        // Map for calendar dots
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

  // Calculate Monthly Stats
  const stats = useMemo(() => {
    let totalVol = 0;
    let totalDist = 0;
    let totalReps = 0;

    history.forEach((h: any) => {
      totalVol += (h.totalVolume || 0);
      totalDist += (h.totalDistance || 0);
      // Note: If you add a totalReps column to history later, sum it here
      totalReps += (h.totalReps || 0); 
    });

    return {
      count: history.length,
      volume: totalVol,
      distance: totalDist,
      reps: totalReps,
    };
  }, [history]);

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

        {/* Clear history */}
      <View>
        <Pressable onPress={() => setShowClearModal(true)} style={styles.dangerButton}>
          <Text style={{ color: '#ff4444' }}>Clear All History</Text>
        </Pressable>

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

      <FlatList
        data={history.slice(0, 10)} // Show last 10
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <Calendar
              theme={{ calendarBackground: '#1f1f1f', dayTextColor: '#fff', todayTextColor: '#4CAF50', monthTextColor: '#fff', arrowColor: '#4CAF50' }}
              markedDates={markedDates}
              style={styles.calendar}
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

              {/* Only show if you decide to track reps in history */}
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
                item.totalDistance > 0 ? `${item.totalDistance.toLocaleString()} miles` : null
              ]
                .filter(Boolean) // Removes null values
                .join(' • ')}
            </Text>
          </View>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  calendar: { borderRadius: 12, margin: 16, backgroundColor: '#1f1f1f' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginBottom: 20 },
  statBox: { alignItems: 'center', backgroundColor: '#1f1f1f', padding: 15, borderRadius: 12, width: '45%' },
  statNum: { color: '#4CAF50', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#aaa', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 16, marginBottom: 12 },
  historyCard: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1a1a1a', padding: 16, marginHorizontal: 16, marginBottom: 10, borderRadius: 12 
  },
  historyTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  historySub: { color: '#777', fontSize: 12, marginTop: 4 },
  historyVol: { color: '#4CAF50', fontWeight: 'bold' },
    statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allows them to wrap to a second line if needed
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  statItem: {
    backgroundColor: '#1f1f1f',
    padding: 12,
    borderRadius: 12,
    width: '48%', // Fits 2 per row
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

});
