import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const UPDATES: Array<{ status: string; title: string; desc: string; icon: IconSymbolName }> = [
  { status: 'Live', title: 'Calendar Tracking', desc: 'Full history with monthly stats and volume tracking.', icon: 'calendar' },
  { status: 'In Progress', title: 'PR & Progression', desc: 'Visual charts for your 1RM and lift history.', icon: 'chart.line.uptrend.xyaxes' },
  { status: 'Planned', title: 'Global Community', desc: 'Connect with other lifters and share routines.', icon: 'person.2.fill' },
  { status: 'Planned', title: 'Profile Customization', desc: 'Custom avatars, bios, and public PR boards.', icon: 'person.crop.circle' },
];

const ROADMAP_DATA = [
  {
    status: 'Live',
    color: '#4CAF50',
    items: [
      { title: 'Calendar History', desc: 'Monthly view of all past sessions with volume stats.', icon: 'calendar' },
      { title: 'Goal Tracking', desc: 'Set and track 1RMs, distance, and time goals.', icon: 'target' },
      { title: 'Active Workout Mode', desc: 'Live stopwatch, rest tracking, and set-by-set checkoffs.', icon: 'play.circle.fill' },
    ]
  },
  // {
  //   status: 'In Progress',
  //   color: '#2196F3',
  //   items: [
  //     { title: 'PR Progression Charts', desc: 'Visual graphs to see your strength gains over time.', icon: 'chart.line.uptrend.xyaxes' },
  //     { title: 'Profile Customization', desc: 'Personalize your profile and public PR board.', icon: 'person.crop.circle' },
  //   ]
  // },
  {
    status: 'Planned',
    color: '#888',
    items: [
      { title: 'Global Community', desc: 'Chat and share routines with other lifters.', icon: 'person.2.fill' },
      // { title: 'Nutrition Integration', desc: 'Quick calorie and macro logging for your bulk/cut.', icon: 'fork.knife' },
    ]
  }
];

export default function UpdatesPage() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.iconCircle}>
            <IconSymbol size={50} color="#4CAF50" name="sparkles" />
          </View>
          <ThemedText type="title" style={styles.title}>Roadmap</ThemedText>
          <ThemedText style={styles.subtitle}>Our journey to the ultimate fitness partner.</ThemedText>
        </View>

        {/* Grouped Sections */}
        {ROADMAP_DATA.map((section) => (
          <View key={section.status} style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.statusDot, { backgroundColor: section.color }]} />
              <Text style={[styles.sectionLabel, { color: section.color }]}>
                {section.status.toUpperCase()}
              </Text>
            </View>

            {section.items.map((item, idx) => (
              <View key={idx} style={styles.updateCard}>
                <View style={styles.cardHeader}>
                  <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
                  <IconSymbol size={20} color="#444" name={item.icon} />
                </View>
                <ThemedText style={styles.cardDesc}>{item.desc}</ThemedText>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.missionCard}>
          <ThemedText style={styles.missionText}>
            Every update is built based on lifter feedback. Have a request? Let us know.
          </ThemedText>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { padding: 20, paddingTop: 40 },
  headerContainer: { alignItems: 'center', marginBottom: 40 },
  iconCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  title: { fontFamily: Fonts.rounded, fontSize: 32, color: '#fff', fontWeight: '800' },
  subtitle: { fontSize: 14, color: '#777', marginTop: 4, textAlign: 'center' },
  sectionContainer: { marginBottom: 30 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  updateCard: {
    backgroundColor: '#1f1f1f', borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardDesc: { color: '#aaa', fontSize: 13, marginTop: 4, lineHeight: 18 },
  missionCard: {
    marginTop: 10, padding: 20, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)', borderStyle: 'dashed',
    borderWidth: 1, borderColor: '#333',
  },
  missionText: { color: '#666', fontSize: 13, textAlign: 'center', fontStyle: 'italic' },
});
