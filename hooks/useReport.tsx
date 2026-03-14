import { auth } from '@/lib/firebase';
import { reportPost } from '@/repositories/threadRepo';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const REASONS = ["Spam", "Harassment", "Inappropriate Content", "Misinformation", "Other"];

export const useReport = () => {
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [targetPostId, setTargetPostId] = useState<string | null>(null);

  const openReportModal = (postId: string) => {
    setTargetPostId(postId);
    setSelectedReason(REASONS[0]);
    setReportModalVisible(true);
  };

  const submitReport = async () => {
    if (!targetPostId || !auth.currentUser) return;
    try {
      await reportPost(targetPostId, auth.currentUser.uid, selectedReason);
      setReportModalVisible(false);
    } catch (error) {
      console.error("Report submission failed:", error);
    }
  };

  const ReasonPicker = () => (
    <View style={styles.reasonContainer}>
      <Text style={styles.reasonLabel}>Select a reason:</Text>
      {REASONS.map((reason) => (
        <Pressable 
          key={reason} 
          onPress={() => setSelectedReason(reason)}
          style={[styles.reasonItem, selectedReason === reason && styles.reasonItemActive]}
        >
          <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextActive]}>{reason}</Text>
          {selectedReason === reason && <MaterialIcons name="check" size={18} color="#4CAF50" />}
        </Pressable>
      ))}
    </View>
  );

  return {
    reportModalVisible,
    setReportModalVisible,
    openReportModal,
    submitReport,
    ReasonPicker,
  };
};

const styles = StyleSheet.create({
  reasonContainer: { width: '100%' },
  reasonLabel: { color: '#888', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  reasonItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 6, backgroundColor: '#252525' },
  reasonItemActive: { backgroundColor: 'rgba(76, 175, 80, 0.1)', borderWidth: 1, borderColor: '#4CAF50' },
  reasonText: { color: '#ccc', fontSize: 15 },
  reasonTextActive: { color: '#4CAF50', fontWeight: 'bold' },
});
