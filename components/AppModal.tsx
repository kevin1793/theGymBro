import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface AppModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'success' | 'danger';
  children?: React.ReactNode; // ADDED: Allow custom content like pickers
}

export const AppModal = ({
  visible,
  title,
  onClose,
  onConfirm,
  confirmText = 'Yes',
  cancelText = 'Cancel',
  variant = 'success',
  children, // ADDED
}: AppModalProps) => {
  const isDanger = variant === 'danger';

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable 
          style={styles.modalCard} 
          onPress={(e) => e.stopPropagation()} 
        >
          <Text style={styles.modalTitle}>{title}</Text>

          {/* ADDED: Render custom picker content if provided */}
          {children && <View style={styles.customContent}>{children}</View>}

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
    backgroundColor: 'rgba(0,0,0,0.8)', // Darkened for better focus
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#1f1f1f',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15, // Reduced to accommodate children
    textAlign: 'center',
  },
  customContent: {
    width: '100%',
    marginBottom: 20, // Space before buttons
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  confirmBaseText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
  saveText: {
    color: '#4CAF50',
  },
  deleteText: {
    color: '#ff4444',
  },
});
