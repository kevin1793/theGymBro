import { AppModal } from '@/components/AppModal';
import { clearWorkoutHistory, getAll } from '@/database/db';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i + 2); // Includes 2 future years

export default function WorkoutCalendar() {
  const [history, setHistory] = useState<any[]>([]);
  const [markedDates, setMarkedDates] = useState({});
  const [showClearModal, setShowClearModal] = useState(false);
  
  // Picker States
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  // Default to YYYY-MM
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().split('-').slice(0, 2).join('-'));
  
  // Temporary states for the Modal picker
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempYear, setTempYear] = useState(new Date().getFullYear());

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

  const stats = useMemo(() => {
    let totalVol = 0, totalDist = 0, totalReps = 0, count = 0;
    history.forEach((h: any) => {
      const workoutDate = new Date(h.createdAt).toISOString().split('-').slice(0, 2).join('-');
      if (workoutDate === currentMonth) {
        count++;
        totalVol += (h.totalVolume || 0);
        totalDist += (h.totalDistance || 0);
        totalReps += (h.totalReps || 0); 
      }
    });
    return { count, volume: totalVol, distance: totalDist, reps: totalReps };
  }, [history, currentMonth]);

  const handleConfirmPicker = () => {
    const formattedDate = `${tempYear}-${String(tempMonth + 1).padStart(2, '0')}`;
    setCurrentMonth(formattedDate);
    setIsPickerVisible(false);
  };

  const formatDuration = (sec: number) => `${Math.floor(sec / 60)}m ${sec % 60}s`;

  // Helper to get month name for the header
  const getHeaderLabel = () => {
    const [year, month] = currentMonth.split('-');
    return `${MONTHS[parseInt(month) - 1]} ${year}`;
  };

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
              // Syncs the calendar view and arrow logic with our state
              current={`${currentMonth}-01`}
              key={currentMonth} // Forces arrows to reset their internal calculation
              theme={{
                calendarBackground: '#1f1f1f',
                dayTextColor: '#fff',
                todayTextColor: '#4CAF50',
                monthTextColor: '#fff',
                arrowColor: '#4CAF50',
                textDisabledColor: '#444',
                dotColor: '#4CAF50',
                textDayFontSize: 14,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 12,
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '700',
                textSectionTitleColor: '#888', 
              }}
              markedDates={markedDates}
              style={styles.calendar}
              onMonthChange={(month) => {
                setCurrentMonth(month.dateString.split('-').slice(0, 2).join('-'));
              }}
              renderHeader={() => (
                <Pressable onPress={() => setIsPickerVisible(true)} style={styles.headerButton}>
                  <Text style={styles.headerText}>{getHeaderLabel()}</Text>
                  <Ionicons name="chevron-down" size={16} color="#4CAF50" />
                </Pressable>
              )}
            />

            <View style={styles.statsGrid}>
              <View style={styles.statItem}><Text style={styles.statLabel}>WORKOUTS</Text><Text style={styles.statValue}>{stats.count}</Text></View>
              <View style={styles.statItem}><Text style={styles.statLabel}>TOTAL LBS</Text><Text style={styles.statValue}>{stats.volume.toLocaleString()}</Text></View>
              <View style={styles.statItem}><Text style={styles.statLabel}>DISTANCE</Text><Text style={styles.statValue}>{stats.distance.toFixed(1)}mi</Text></View>
              <View style={styles.statItem}><Text style={styles.statLabel}>TOTAL REPS</Text><Text style={styles.statValue}>{stats.reps.toLocaleString()}</Text></View>
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
                {item.totalVolume > 0 ? `${item.totalVolume.toLocaleString()} lbs` : 
                 item.totalDistance > 0 ? `${item.totalDistance.toFixed(1)} mi` : 
                 `${item.totalReps} reps`}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <Pressable onPress={() => setShowClearModal(true)} style={{ marginVertical: 30 }}>
            <Text style={{ color: '#ff4444', textAlign: 'center' }}>Clear All History</Text>
          </Pressable>
        }
      />

      {/* Picker Modal injected via 'children' */}
      <AppModal
        visible={isPickerVisible}
        title="Jump to Month"
        confirmText="Select"
        onClose={() => setIsPickerVisible(false)}
        onConfirm={handleConfirmPicker}
      >
        <View style={styles.pickerContainer}>
          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
            {MONTHS.map((m, i) => (
              <Pressable key={m} onPress={() => setTempMonth(i)} style={[styles.pickerItem, tempMonth === i && styles.pickerItemActive]}>
                <Text style={[styles.pickerText, tempMonth === i && styles.pickerTextActive]}>{m}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
            {YEARS.map(y => (
              <Pressable key={y} onPress={() => setTempYear(y)} style={[styles.pickerItem, tempYear === y && styles.pickerItemActive]}>
                <Text style={[styles.pickerText, tempYear === y && styles.pickerTextActive]}>{y}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </AppModal>

      <AppModal
        visible={showClearModal}
        variant="danger"
        title="Clear All History?"
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearAll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  calendar: { borderRadius: 12, margin: 16, backgroundColor: '#1f1f1f' },
  headerButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2a2a2a', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  headerText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 16, marginBottom: 12 },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 16, marginHorizontal: 16, marginBottom: 10, borderRadius: 12 },
  historyTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  historySub: { color: '#777', fontSize: 12, marginTop: 4 },
  historyVol: { color: '#4CAF50', fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 20, gap: 10 },
  statItem: { backgroundColor: '#1f1f1f', padding: 12, borderRadius: 12, width: '48%', alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  statLabel: { color: '#888', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  statValue: { color: '#4CAF50', fontSize: 18, fontWeight: 'bold' },
  pickerContainer: { flexDirection: 'row', height: 250 },
  pickerList: { flex: 1 },
  pickerItem: { paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  pickerItemActive: { backgroundColor: 'rgba(76, 175, 80, 0.1)' },
  pickerText: { color: '#888', fontSize: 16 },
  pickerTextActive: { color: '#4CAF50', fontWeight: 'bold' },
});
