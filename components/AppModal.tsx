import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface AppModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'success' | 'danger'; // Toggles Green vs Red
}

export const AppModal = ({
  visible,
  title,
  onClose,
  onConfirm,
  confirmText = 'Yes',
  cancelText = 'Cancel',
  variant = 'success',
}) => {
  const isDanger = variant === 'danger';

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      {/* 1. The Overlay Pressable: Catches taps outside the card */}
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        
        {/* 2. The Card Pressable: Stops the "onClose" event from bubbling up */}
        <Pressable 
          style={styles.modalCard} 
          onPress={(e) => e.stopPropagation()} // Prevents closing when clicking the card itself
        >
          <Text style={styles.modalTitle}>{title}</Text>

          <View style={styles.modalButtons}>
            <Pressable style={styles.modalButton} onPress={onClose}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>

            <Pressable style={styles.modalButton} onPress={onConfirm}>
              <Text style={[styles.confirmBaseText, isDanger ? styles.deleteText : styles.saveText]}>
                {confirmText}
              </Text>
            </Pressable>
          </View>
        </Pressable>

      </Pressable>
    </Modal>
  );
};


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: '#1f1f1f',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  confirmBaseText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancelText: {
    color: '#aaa',
    fontSize: 16,
  },
  saveText: {
    color: '#4CAF50', // Green
  },
  deleteText: {
    color: '#ff4444', // Red
  },
});
