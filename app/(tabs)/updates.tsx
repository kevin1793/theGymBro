import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function UpdatesPage() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <IconSymbol
            size={180}
            color="#4CAF50"
            name="sparkles"
            style={styles.headerIcon}
          />
          <ThemedText type="title" style={styles.title}>
            Updates & Roadmap
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Here's what’s coming next in the app.
          </ThemedText>
        </View>

        {/* Upcoming Features */}
        <Collapsible title="Upcoming Features">
          <ThemedText>🔥 Global chat / community threads</ThemedText>
          <ThemedText>⚡ Profile editing & customization</ThemedText>
          <ThemedText>📅 Calendar-based workout tracking</ThemedText>
          <ThemedText>🏋️‍♂️ PRs & progression tracking</ThemedText>
          <ThemedText>✨ And much more!</ThemedText>
        </Collapsible>

        {/* Notes / Info */}
        <Collapsible title="Why we’re building this">
          <ThemedText>
            The goal of this app is to help you track your progress, connect with
            the community, and stay motivated. We’ll continue adding features based
            on feedback and usage.
          </ThemedText>
        </Collapsible>

        <Collapsible title="Work in Progress">
          <ThemedText>
            This page is a placeholder for updates. As the app evolves, we’ll include
            release notes, feature highlights, and announcements here.
          </ThemedText>
        </Collapsible>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerIcon: {
    marginBottom: 12,
  },
  title: {
    fontFamily: Fonts.rounded,
    fontSize: 28,
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 6,
  },
});