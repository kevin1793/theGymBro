import { exercises } from '@/data/exercises';
import { auth, db } from '@/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

// Unique ID generator
const generateID = () => Math.random().toString(36).substring(2, 9);

type SetType = {
  id: string;
  reps?: string;
  weight?: string;
  distance?: string;
  minutes?: string;
  seconds?: string;
  type: 'warmup' | 'working';
};

type ExerciseType = {
  id: string;
  name: string;
  category: string;
  sets: SetType[];
};

export default function CreateWorkout() {
  const router = useRouter();

  const userWeightUnit: 'kg' | 'lbs' = 'lbs';
  const userDistanceUnit: 'km' | 'miles' = 'miles';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState<ExerciseType[]>([]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = useMemo(
    () =>
      exercises.filter((ex) =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  const isCore = (category: string) => category.toLowerCase() === 'core';
  const isCardio = (category: string) => category.toLowerCase() === 'cardio';
  const isStrength = (category: string) =>
    !isCore(category) && !isCardio(category);

  // ---------------- Add Exercise ----------------
  const handleAddExercise = (exerciseName: string) => {
    const found = exercises.find((e) => e.name === exerciseName);
    if (!found) return;

    setWorkoutExercises((prev) => [
      ...prev,
      {
        id: generateID(),
        name: found.name,
        category: found.category,
        sets: [
          {
            id: generateID(),
            reps: '',
            weight: '',
            distance: '',
            minutes: '',
            seconds: '',
            type: 'working',
          },
        ],
      },
    ]);
    setModalVisible(false);
    setSearchQuery('');
  };

  // ---------------- Set Handlers ----------------
  const addSet = (exerciseIndex: number) => {
    const updated = [...workoutExercises];
    updated[exerciseIndex].sets.push({
      id: generateID(),
      reps: '',
      weight: '',
      distance: '',
      minutes: '',
      seconds: '',
      type: 'working',
    });
    setWorkoutExercises(updated);
  };

  const deleteSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...workoutExercises];
    updated[exerciseIndex].sets.splice(setIndex, 1);
    setWorkoutExercises(updated);
  };

  const moveSet = (exerciseIndex: number, setIndex: number, direction: 'up' | 'down') => {
    const updated = [...workoutExercises];
    const sets = updated[exerciseIndex].sets;
    if (direction === 'up' && setIndex > 0) {
      [sets[setIndex - 1], sets[setIndex]] = [sets[setIndex], sets[setIndex - 1]];
    }
    if (direction === 'down' && setIndex < sets.length - 1) {
      [sets[setIndex + 1], sets[setIndex]] = [sets[setIndex], sets[setIndex + 1]];
    }
    setWorkoutExercises(updated);
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof SetType,
    value: string
  ) => {
    const updated = [...workoutExercises];
    updated[exerciseIndex].sets[setIndex] = {
      ...updated[exerciseIndex].sets[setIndex],
      [field]: value,
    };
    setWorkoutExercises(updated);
  };

  // ---------------- Delete Exercise ----------------
  const deleteExercise = (exerciseIndex: number) => {
    const updated = [...workoutExercises];
    updated.splice(exerciseIndex, 1);
    setWorkoutExercises(updated);
  };

  // ---------------- Totals ----------------
  const totals = useMemo(() => {
    let volume = 0;
    let totalDistance = 0;
    let totalReps = 0;
    let totalTime = 0;

    workoutExercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        const reps = Number(set.reps || 0);
        const weight = Number(set.weight || 0);
        const distance = Number(set.distance || 0);
        const minutes = Number(set.minutes || 0);
        const seconds = Number(set.seconds || 0);
        const time = minutes * 60 + seconds;

        if (isStrength(ex.category)) {
          volume += reps * weight;
          totalReps += reps;
        }

        if (isCore(ex.category)) {
          totalReps += reps;
          totalTime += time;
        }

        if (isCardio(ex.category)) {
          totalDistance += distance;
          totalTime += time;
        }
      });
    });

    return { volume, totalDistance, totalReps, totalTime };
  }, [workoutExercises]);

  // ---------------- Save Workout ----------------
  const handleSaveWorkout = async () => {
    // Prevent saving if no title or no exercises
    if (!title.trim()) {
      alert('Please enter a workout title.');
      return;
    }

    if (workoutExercises.length === 0) {
      alert('Please add at least one exercise.');
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, 'users', user.uid, 'workouts'), {
        title,
        description,
        exercises: workoutExercises,
        totals,
        weightUnit: userWeightUnit,
        distanceUnit: userDistanceUnit,
        createdAt: serverTimestamp(),
      });

      router.replace('/(tabs)');
    } catch (error) {
      console.log('Error saving workout:', error);
      alert('Failed to save workout. Please try again.');
    }
  };


  // ---------------- Render Set ----------------
  const renderSet = (set: SetType, setIndex: number, exerciseIndex: number) => {
    const ex = workoutExercises[exerciseIndex];
    return (
      <View key={set.id} style={styles.setRow}>
        {/* Up/Down arrows */}
        <Pressable onPress={() => moveSet(exerciseIndex, setIndex, 'up')}>
          <Ionicons name="arrow-up" size={15} color="#777" />
        </Pressable>
        <Pressable onPress={() => moveSet(exerciseIndex, setIndex, 'down')}>
          <Ionicons name="arrow-down" size={15} color="#777" />
        </Pressable>

        <Pressable
          onPress={() =>
            updateSet(
              exerciseIndex,
              setIndex,
              'type',
              set.type === 'working' ? 'warmup' : 'working'
            )
          }
        >
          <Text
            style={{
              color: set.type === 'warmup' ? '#FFA726' : '#4CAF50',
              marginLeft: 4,
              width: 50,
            }}
          >
            {set.type}
          </Text>
        </Pressable>

        {isStrength(ex.category) && (
          <>
            <TextInput
              style={styles.smallSetInput}
              placeholder="Reps"
              value={set.reps}
              keyboardType="numeric"
              onChangeText={(v) => updateSet(exerciseIndex, setIndex, 'reps', v)}
            />
            <TextInput
              style={styles.smallSetInput}
              placeholder={`Weight (${userWeightUnit})`}
              value={set.weight}
              keyboardType="numeric"
              onChangeText={(v) =>
                updateSet(exerciseIndex, setIndex, 'weight', v)
              }
            />
          </>
        )}

        {isCardio(ex.category) && (
          <>
            <TextInput
              style={styles.smallSetInput}
              placeholder={`Distance (${userDistanceUnit})`}
              value={set.distance}
              keyboardType="numeric"
              onChangeText={(v) =>
                updateSet(exerciseIndex, setIndex, 'distance', v)
              }
            />
            <TextInput
              style={styles.smallSetInput}
              placeholder="Min"
              value={set.minutes}
              keyboardType="numeric"
              onChangeText={(v) =>
                updateSet(exerciseIndex, setIndex, 'minutes', v)
              }
            />
            <TextInput
              style={styles.smallSetInput}
              placeholder="Sec"
              value={set.seconds}
              keyboardType="numeric"
              onChangeText={(v) =>
                updateSet(exerciseIndex, setIndex, 'seconds', v)
              }
            />
          </>
        )}

        <Pressable onPress={() => deleteSet(exerciseIndex, setIndex)}>
          <Ionicons name="trash" size={20} color="#ff5252" />
        </Pressable>
      </View>
    );
  };

  // ---------------- Render Exercise ----------------
const renderExercise = ({ item, drag, isActive }: RenderItemParams<ExerciseType>) => {
  const exerciseIndex = workoutExercises.findIndex((e) => e.id === item.id);

  return (
    <Pressable
      onLongPress={drag}
      disabled={isActive}
      style={[
        styles.exerciseBox,
        { backgroundColor: isActive ? '#2a2a2a' : '#1a1a1a' },
      ]}
    >
      <Text style={styles.exerciseTitle}>{item.name}</Text>

      {item.sets.map((set, setIndex) => renderSet(set, setIndex, exerciseIndex))}

      <Pressable onPress={() => addSet(exerciseIndex)}>
        <Text style={styles.addSetText}>+ Add Set</Text>
      </Pressable>

      {/* Trash icon at bottom */}
      <Pressable
        onPress={() => deleteExercise(exerciseIndex)}
        style={styles.exerciseTrash}
      >
        {/* <Ionicons name="trash" size={20} color="#ff5252" /> */}
        <Text style={{ color: '#ff5252', marginLeft: 6 }}>Delete Exercise</Text>
      </Pressable>
    </Pressable>
  );
};


  // ---------------- Convert seconds to h:m:s ----------------
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    let str = '';
    if (hrs > 0) str += `${hrs}h `;
    if (mins > 0) str += `${mins}m `;
    if (secs > 0 || str === '') str += `${secs}s`;
    return str.trim();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#121212' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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

      <FlatList
        data={[{ key: 'form' }]}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.container}
        renderItem={() => (
          <>
            <Text style={styles.header}>Create Workout</Text>

            <TextInput
              style={styles.input}
              placeholder="Workout Title"
              placeholderTextColor="#777"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Notes..."
              placeholderTextColor="#777"
              multiline
              value={description}
              onChangeText={setDescription}
            />

            {/* Add exercise button */}
            <Pressable
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={{ color: '#fff' }}>+ Add Exercise</Text>
            </Pressable>

            <DraggableFlatList
              data={workoutExercises}
              keyExtractor={(item) => item.id}
              renderItem={renderExercise}
              onDragEnd={({ data }) => setWorkoutExercises(data)}
            />

            <View style={{ marginTop: 20 }}>
              <Text style={styles.total}>
                Total Volume: {totals.volume} {userWeightUnit}
              </Text>
              <Text style={styles.total}>Total Reps: {totals.totalReps}</Text>
              <Text style={styles.total}>
                Total Distance: {totals.totalDistance} {userDistanceUnit}
              </Text>
              {totals.totalTime > 0 && (
                <Text style={styles.total}>
                  Total Time: {formatTime(totals.totalTime)}
                </Text>
              )}
            </View>

            <Pressable style={styles.saveButton} onPress={handleSaveWorkout}>
              <Text style={styles.saveText}>Save Workout</Text>
            </Pressable>

            {/* Modal for exercise selection */}
            <Modal visible={modalVisible} animationType="slide">
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Select Exercise</Text>

                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor="#777"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />

                <FlatList
                  data={filteredExercises}
                  keyExtractor={(item) => item.name}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.exerciseItem}
                      onPress={() => handleAddExercise(item.name)}
                    >
                      <Text style={{ color: '#fff' }}>{item.name}</Text>
                      <Text style={{ color: '#777', fontSize: 12 }}>
                        {item.category}
                      </Text>
                    </Pressable>
                  )}
                />

                <Pressable
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ color: '#fff' }}>Close</Text>
                </Pressable>
              </View>
            </Modal>
          </>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  exerciseTrash: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 13,
    borderTopColor: '#333',
    borderTopWidth: 1,
  },

  container: { padding: 20 },
  header: { fontSize: 28, color: '#fff', marginBottom: 20 },
  input: {
    backgroundColor: '#1f1f1f',
    color: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  exerciseBox: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  exerciseTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  smallSetInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 6,
    width: 50,
    borderRadius: 8,
    flex: 1,
  },
  addSetText: { color: '#4CAF50', marginTop: 10 },
  total: { color: '#fff', fontSize: 16 },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#121212', padding: 20 },
  modalTitle: { fontSize: 22, color: '#fff', marginBottom: 10 },
  searchInput: {
    backgroundColor: '#1f1f1f',
    color: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  exerciseItem: {
    padding: 15,
    borderBottomColor: '#222',
    borderBottomWidth: 1,
  },
  closeButton: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
});
