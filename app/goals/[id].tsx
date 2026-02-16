import { auth, db } from '@/lib/firebase';
import { formatTime } from '@/utils/helper'; // helper to format time units
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoals } from '../context/GoalsContext'; // adjust path


type Goal = {
  id: string;
  title: string;
  exercise: string;
  goalType: string;
  measurementType: string;
  unit: string;
  startValue: number;
  currentValue: number;
  targetValue: number;
  secondaryValue?: number | null;
  secondaryUnit?: string | null;
  createdAt: any;
};

export default function GoalView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editMinutes, setEditMinutes] = useState('');
  const [editSeconds, setEditSeconds] = useState('');
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTimeVisible, setEditTimeVisible] = useState(false);

  const { addOrUpdateGoal, removeGoal } = useGoals();


  useEffect(() => {
    const fetchGoal = async () => {
      if (!id) return;
      try {
        const user = auth.currentUser;
        if (!user) return;

        const goalDoc = await getDoc(doc(db, 'users', user.uid, 'goals', id));
        if (goalDoc.exists()) {
          const goalData = goalDoc.data() as Goal;
          setGoal({ id: goalDoc.id, ...goalData });
        } else {
          setGoal(null);
        }
      } catch (error) {
        console.error('Error fetching goal:', error);
        setGoal(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGoal();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 20 }}>
        <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>Goal not found.</Text>
      </View>
    );
  }

  let progressPercent = 0;

  if (goal.startValue != null && goal.currentValue != null && goal.targetValue != null) {
    if (goal.startValue < goal.targetValue) {
      // Higher is better (e.g., weight lifted)
      const totalGain = goal.targetValue - goal.startValue;
      const gained = goal.currentValue - goal.startValue;
      progressPercent = totalGain > 0 ? Math.min((gained / totalGain) * 100, 100) : 0;
    } else {
      // Lower is better (e.g., mile time)
      const totalReduction = goal.startValue - goal.targetValue;
      const reduced = goal.startValue - goal.currentValue;
      progressPercent = totalReduction > 0 ? Math.min((reduced / totalReduction) * 100, 100) : 0;
    }
  }
  const changeCurrentValue = async (delta: number) => {
  if (!goal) return;
  setUpdating(true);
  try {
    const user = auth.currentUser;
    if (!user) return;

    const newValue = goal.currentValue + delta;
    const updatedGoal = { ...goal, currentValue: newValue };
    setGoal(updatedGoal); // update local
    addOrUpdateGoal(updatedGoal); // update global store

    await updateDoc(doc(db, 'users', user.uid, 'goals', goal.id), {
      currentValue: newValue,
    });
  } catch (error) {
    console.error('Error updating currentValue:', error);
  } finally {
    setUpdating(false);
  }
};

const removeGoalFromDb = async () => {
  if (!goal) return;
  try {
    const user = auth.currentUser;
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'goals', goal.id));
    removeGoal(goal.id); // update global store
    router.back();
  } catch (error) {
    console.error('Error deleting goal:', error);
  }
};

const saveEditedValue = async (newSeconds: number) => {
  if (!goal) return;

  const numeric = newSeconds;
  if (isNaN(numeric)) return;

  setEditTimeVisible(false);
  await changeCurrentValue(numeric - goal.currentValue);
};

return (
  <>
    <Stack.Screen
      options={{
        headerLeft: () => (
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back(); // normal push stack
              } else {
                router.push('/'); // fallback if JS stack is empty
              }
            }}
            style={{ paddingHorizontal: 16 }}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
        ),
        title: '',
        headerBackTitle: '',
        headerBackTitleVisible: false,
        headerTintColor: '#fff',
        headerStyle: { backgroundColor: '#121212' },
      }}
    />

    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Edit weight modal */}
        <Modal
          transparent
          animationType="fade"
          visible={editVisible}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit Value</Text>

              <TextInput
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="numeric"
                style={styles.input}
                autoFocus
              />

              <View style={styles.modalButtons}>
                <Pressable onPress={() => setEditVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable onPress={saveEditedValue}>
                  <Text style={styles.saveText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Edit Time Modal */}
        <Modal
          transparent
          animationType="fade"
          visible={editTimeVisible}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit Value</Text>

              {/* Minutes input */}
              <TextInput
                value={editMinutes}
                onChangeText={setEditMinutes}
                keyboardType="numeric"
                style={styles.input}
                placeholder="Minutes"
                placeholderTextColor="#777"
              />

              {/* Seconds input */}
              <TextInput
                value={editSeconds}
                onChangeText={setEditSeconds}
                keyboardType="numeric"
                style={styles.input}
                placeholder="Seconds"
                placeholderTextColor="#777"
              />

              <View style={styles.modalButtons}>
                <Pressable onPress={() => setEditTimeVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    // Convert minutes + seconds to total seconds
                    const totalSeconds =
                      (parseInt(editMinutes || '0', 10) * 60) +
                      parseInt(editSeconds || '0', 10);

                    saveEditedValue(totalSeconds); // pass total seconds
                    setEditTimeVisible(false);
                  }}
                >
                  <Text style={styles.saveText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>


        {/* Delete Goal Modal */}
        <Modal
          transparent
          animationType="fade"
          visible={deleteVisible}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Delete Goal?</Text>

              <View style={styles.modalButtons}>
                <Pressable onPress={() => setDeleteVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setDeleteVisible(false);
                    removeGoalFromDb();
                  }}
                >
                  <Text style={styles.deleteConfirmText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Did you complete {goal.title}?
              </Text>

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Not Yet</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButton]}
                  onPress={() => {
                    setModalVisible(false);
                    // Here you can mark goal as complete
                    // e.g., update Firestore or your context
                    console.log(`Goal ${goal.title} completed!`);
                  }}
                >
                  <Text style={styles.saveText}>Yes</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Text style={styles.title}>{goal.title}</Text>
        <Text style={styles.subTitle}>{goal.exercise}</Text>
        {/* <Text style={styles.subTitle}>Goal Type: {goal.goalType}</Text> */}
        <Text style={styles.subTitle}>
          Started: {goal?.createdAt
            ? new Date(goal.createdAt.seconds * 1000).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '—'}
        </Text>

        <View style={styles.weightsRow}>
          <View style={styles.weightColumn}>
            <Text style={styles.weightLabel}>Starting</Text>
            <Text style={styles.weightValue}>{formatTime(goal.startValue, goal.unit)}</Text>
          </View>
          <View style={styles.weightColumn}>
            <Text style={styles.weightLabel}>Current</Text>
            <Text style={styles.weightValue}>{formatTime(goal.currentValue, goal.unit)}</Text>
          </View>
          <View style={styles.weightColumn}>
            <Text style={styles.weightLabel}>Goal</Text>
            <Text style={styles.weightValue}>{formatTime(goal.targetValue, goal.unit)}</Text>
          </View>
        </View>

        {goal.secondaryValue != null && (
          <Text style={styles.secondary}>
            Secondary Value: {goal.secondaryValue} {goal.secondaryUnit}
          </Text>
        )}

        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {progressPercent.toFixed(0)}%
          </Text>
        </View>

        {/* '-' '+' Counter BELOW progress */}
        <View style={styles.counterSection}>
          <Pressable
            style={[styles.counterButton, styles.minusButton]}
            onPress={() => changeCurrentValue(-1)}
            disabled={updating}
          >
            <Ionicons name="remove" size={22} color="#fff" />
          </Pressable>

          <Pressable
            onPress={() => {
              if (goal.unit === 'seconds') {
                // Prefill minutes & seconds for time modal
                const mins = Math.floor(goal.currentValue / 60);
                const secs = goal.currentValue % 60;
                setEditMinutes(String(mins));
                setEditSeconds(String(secs));
                setEditTimeVisible(true); // show time modal
              } else {
                // Numeric modal
                setEditValue(String(goal.currentValue));
                setEditVisible(true);
              }
            }}
          >
            <Text style={styles.bigValue}>
              {formatTime(goal.currentValue, goal.unit)}
            </Text>
          </Pressable>


          <Pressable
            style={styles.counterButton}
            onPress={() => changeCurrentValue(1)}
            disabled={updating}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Complete Goal Button */}
        <Pressable
          style={styles.completeButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.completeText}>Complete Goal</Text>
        </Pressable>
      </ScrollView>

      {/* Bottom Trash Icon */}
      <View style={styles.bottomBar}>
        <Pressable 
          onPress={() => setDeleteVisible(true)}
          style={styles.trashButton}>
          <Ionicons name="trash-outline" size={26} color="#ff4444" />
        </Pressable>
      </View>
    </SafeAreaView>
  </>

  );
}

const styles = StyleSheet.create({
  // complete modal
  completeButton: {
    marginTop: 60,
    // backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 25,
    borderColor: '#4CAF50',
    borderWidth: 1,
    // width: '20%',
    paddingHorizontal: 30,
    // margin:'0 auto',
    alignItems: 'center',
    alignSelf: 'center'
  },

  completeText: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  modalContent: {
    backgroundColor: '#1f1f1f',
    padding: 24,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
  },

  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },



  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },

  deleteMessage: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },

  deleteConfirmText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    width: '80%',
    backgroundColor: '#1f1f1f',
    padding: 24,
    borderRadius: 20,
  },

  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },

  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 12,
    borderRadius: 12,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },

  cancelText: {
    color: '#aaa',
    fontSize: 16,
  },

  saveText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },

  content: {
    padding: 20,
    paddingBottom: 140,
  },

  counterSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },

  bigValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginHorizontal: 30,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1f1f1f',
    paddingVertical: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },

  trashButton: {
    padding: 10,
  },

  container: { flex: 1, backgroundColor: '#121212' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 10 },
  subTitle: { fontSize: 17, fontWeight: '500', color: '#aaa', marginBottom: 8 },
  weightsRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
  weightColumn: { alignItems: 'center' },
  weightLabel: { fontSize: 18, color: '#aaa', marginBottom: 2 },
  weightValue: { fontSize: 16, color: '#fff', fontWeight: '600' },
  secondary: { fontSize: 14, color: '#fff', marginBottom: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  progressBar: { flex: 1, height: 8, backgroundColor: '#333', borderRadius: 4, overflow: 'hidden', marginRight: 8 },
  progressFill: { height: '100%', backgroundColor: '#4CAF50' },
  progressText: { color: '#fff', fontSize: 15, width: 50, textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  counter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  counterButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 25,
    marginHorizontal: 20,
  },
  minusButton: {
    backgroundColor: '#EF5350', // strong red
  },

  plusButton: {
    backgroundColor: '#81C784', // your green
  },

  counterText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  currentValue: { color: '#fff', fontSize: 18, fontWeight: '600' },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
