import { exercises } from '@/data/exercises';
import { getAll, getOne, run } from '@/database/db';
import { formatHMS } from '@/utils/helper';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ---------------- Types ----------------
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

type WorkoutType = {
  id: string;
  title: string;
  description?: string;
  exercises: ExerciseType[];
  createdAt: number;
  updatedAt: number;
};

// ---------------- ID Generator ----------------
const generateID = () => Math.random().toString(36).substring(2, 9);

// ---------------- Main Component ----------------
export default function CreateWorkout() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const userWeightUnit: 'kg' | 'lbs' = 'lbs';
  const userDistanceUnit: 'km' | 'miles' = 'miles';

  // ---------------- State ----------------
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState<ExerciseType[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { id: editId } = useLocalSearchParams<{ id: string }>();
  const workoutId = editId || generateID(); // use this everywhere
  const { fromEdit } = useLocalSearchParams<{ fromEdit?: string }>();


  // ---------------- Load workout if editing ----------------
  useEffect(() => {
    console.log('WORKOUT VIEW PAGE')
    const fetchWorkout = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const workoutData = await getOne<WorkoutType>(`SELECT * FROM workouts WHERE id = ?`, [id]);
        if (!workoutData) return;

        const exercisesData: ExerciseType[] = await getAll<ExerciseType>(
          `SELECT * FROM exercises WHERE workoutId = ?`,
          [workoutData.id]
        );

        for (let ex of exercisesData) {
          const setsData: SetType[] = await getAll<SetType>(
            `SELECT * FROM sets WHERE exerciseId = ?`,
            [ex.id]
          );

          ex.sets = setsData.map(set => ({
            ...set,
            reps: set.reps?.toString(),
            weight: set.weight?.toString(),
            distance: set.distance?.toString(),
            minutes: set.minutes?.toString(),
            seconds: set.seconds?.toString(),
            type: set.type || 'working',
          }));
        }

        setTitle(workoutData.title);
        setDescription(workoutData.description || '');
        setWorkoutExercises(exercisesData);
      } catch (error) {
        console.error('Error fetching workout:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [id]);

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

  // ---------------- Exercise Handlers ----------------
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

const handleSaveWorkout = async () => {
  if (!title.trim()) {
    alert('Please enter a workout title.');
    return;
  }

  if (workoutExercises.length === 0) {
    alert('Please add at least one exercise.');
    return;
  }

  try {
    const now = Date.now();
    const finalWorkoutId = id || editId || generateID();

    // 1. Save or Update the Workout entry
    if (id || editId) {
      await run(
        `UPDATE workouts SET title = ?, description = ?, updatedAt = ? WHERE id = ?`,
        [title, description, now, finalWorkoutId]
      );
    } else {
      await run(
        `INSERT INTO workouts (id, title, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
        [finalWorkoutId, title, description, now, now]
      );
    }

    // 2. DELETE Exercises that were removed from the UI
    const currentExerciseIds = workoutExercises.map((ex) => ex.id);
    const placeholders = currentExerciseIds.map(() => '?').join(',');
    
    // Delete sets belonging to exercises that are about to be deleted
    await run(
      `DELETE FROM sets WHERE exerciseId IN (SELECT id FROM exercises WHERE workoutId = ? AND id NOT IN (${placeholders}))`,
      [finalWorkoutId, ...currentExerciseIds]
    );
    // Delete the exercises themselves
    await run(
      `DELETE FROM exercises WHERE workoutId = ? AND id NOT IN (${placeholders})`,
      [finalWorkoutId, ...currentExerciseIds]
    );

    // 3. Loop through current UI exercises to Save/Update
    for (const ex of workoutExercises) {
      const exerciseExists = await getOne(`SELECT id FROM exercises WHERE id = ?`, [ex.id]);

      if (exerciseExists) {
        await run(
          `UPDATE exercises SET name = ?, category = ? WHERE id = ?`,
          [ex.name, ex.category, ex.id]
        );
      } else {
        await run(
          `INSERT INTO exercises (id, workoutId, name, category) VALUES (?, ?, ?, ?)`,
          [ex.id, finalWorkoutId, ex.name, ex.category]
        );
      }

      // 4. DELETE Sets within this exercise that were removed from UI
      const currentSetIds = ex.sets.map((s) => s.id);
      const setPlaceholders = currentSetIds.map(() => '?').join(',');
      
      await run(
        `DELETE FROM sets WHERE exerciseId = ? AND id NOT IN (${setPlaceholders})`,
        [ex.id, ...currentSetIds]
      );

      // 5. Save/Update remaining Sets
      for (const set of ex.sets) {
        const setExists = await getOne(`SELECT id FROM sets WHERE id = ?`, [set.id]);

        if (setExists) {
          await run(
            `UPDATE sets SET reps = ?, weight = ?, distance = ?, minutes = ?, seconds = ?, type = ? WHERE id = ?`,
            [set.reps, set.weight, set.distance, set.minutes, set.seconds, set.type, set.id]
          );
        } else {
          await run(
            `INSERT INTO sets (id, exerciseId, reps, weight, distance, minutes, seconds, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [set.id, ex.id, set.reps, set.weight, set.distance, set.minutes, set.seconds, set.type]
          );
        }
      }
    }

    // 6. Navigation
    if (id || editId) {
      // Replace the Edit screen with the View screen so 'Back' goes to Home
      router.replace({
        pathname: "/workouts/[id]",
        params: { id: finalWorkoutId }
      });
    } else {
      router.replace('/(tabs)');
    }

  } catch (error) {
    console.error('Error saving workout:', error);
    alert('Failed to save workout.');
  }
};


  // ---------------- Renderers ----------------
  const renderSet = (set: SetType, setIndex: number, exerciseIndex: number) => {
    const ex = workoutExercises[exerciseIndex];
    return (
      <View key={set.id} style={styles.setRow}>
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
              onChangeText={(v) => updateSet(exerciseIndex, setIndex, 'weight', v)}
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
              onChangeText={(v) => updateSet(exerciseIndex, setIndex, 'distance', v)}
            />
            <TextInput
              style={styles.smallSetInput}
              placeholder="Min"
              value={set.minutes}
              keyboardType="numeric"
              onChangeText={(v) => updateSet(exerciseIndex, setIndex, 'minutes', v)}
            />
            <TextInput
              style={styles.smallSetInput}
              placeholder="Sec"
              value={set.seconds}
              keyboardType="numeric"
              onChangeText={(v) => updateSet(exerciseIndex, setIndex, 'seconds', v)}
            />
          </>
        )}

        <Pressable 
        onPress={() => deleteSet(exerciseIndex, setIndex)}
        style={{ marginLeft: 'auto', paddingLeft: 10 }}
        >
          <Ionicons name="trash" size={20} color="#ff5252" />
        </Pressable>
      </View>
    );
  };

const renderExercise = ({ item, drag, isActive }: RenderItemParams<ExerciseType>) => {
  const exerciseIndex = workoutExercises.findIndex((e) => e.id === item.id);
  const isCardioEx = isCardio(item.category);

  return (
    <Pressable
      onLongPress={drag}
      disabled={isActive}
      style={[styles.exerciseBox, { backgroundColor: isActive ? '#2a2a2a' : '#1a1a1a' }]}
    >
      <Text style={styles.exerciseTitle}>{item.name}</Text>

      {/* --- Column Labels --- */}
      {item.sets.length > 0 && (
        <View style={styles.labelRow}>
          <Text style={[styles.labelText, { width: 40 }]}>Move</Text>
          <Text style={[styles.labelText, { width: 50 }]}>Type</Text>
          
          {isCardioEx ? (
            <>
              <Text style={[styles.labelText, { flex: 1 }]}>Dist</Text>
              <Text style={[styles.labelText, { flex: 1 }]}>Min</Text>
              <Text style={[styles.labelText, { flex: 1 }]}>Sec</Text>
            </>
          ) : (
            <>
              <Text style={[styles.labelText, { flex: 1 }]}>Reps</Text>
              <Text style={[styles.labelText, { flex: 1 }]}>Weight</Text>
            </>
          )}
          <View style={{ width: 30 }} />
        </View>
      )}

      {item.sets.map((set, setIndex) => renderSet(set, setIndex, exerciseIndex))}

      <View style={styles.exerciseFooter}>
        <Pressable onPress={() => addSet(exerciseIndex)}>
          <Text style={styles.addSetText}>Add Set</Text>
        </Pressable>
        <Pressable onPress={() => deleteExercise(exerciseIndex)} style={styles.exerciseTrash}>
          {/* <Ionicons name="trash-outline" size={16} color="#ff5252" /> */}
          <Text style={{ color: '#ff5252', marginLeft: 6 }}>Delete Exercise</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#fff' }}>{id ? 'Loading workout...' : 'Loading...'}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          headerLeft: () => {
            const { fromEdit } = useLocalSearchParams<{ fromEdit?: string }>();
            const router = useRouter();

            return (
              <Pressable
                onPress={() => {
                  console.log('Back pressed. fromEdit:', fromEdit);
                  if (fromEdit) {
                    router.replace('/(tabs)');
                  } else {
                    router.back();
                  }
                }}
                style={{ paddingHorizontal: 16 }}
              >
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </Pressable>
            );
          },
          title: 'Workout',
          headerStyle: { backgroundColor: '#121212' },
          headerTintColor: '#fff',
        }}
      />

      <FlatList
        data={[{ key: 'form' }]}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.container}
        renderItem={() => (
          <>
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

            <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
              <Text style={{ color: '#fff' }}>+ Add Exercise</Text>
            </Pressable>

            {workoutExercises.length >= 2 && (
              <View style={styles.tipContainer}>
                <Ionicons name="information-circle-outline" size={16} color="#888" />
                <Text style={styles.tipText}>Tip: Long press and drag to reorder exercises</Text>
              </View>
            )}

            <DraggableFlatList
              data={workoutExercises}
              keyExtractor={(item) => item.id}
              renderItem={renderExercise}
              onDragEnd={({ data }) => setWorkoutExercises(data)}
            />

            <View style={{ marginTop: 20 }}>
              {/* Show Volume only if there is strength data */}
              {totals.volume > 0 && (
                <Text style={styles.total}>
                  Total Volume: {totals.volume} {userWeightUnit}
                </Text>
              )}

              {/* Show Reps only if reps were performed */}
              {totals.totalReps > 0 && (
                <Text style={styles.total}>
                  Total Reps: {totals.totalReps}
                </Text>
              )}

              {/* Show Distance only if there's cardio data */}
              {totals.totalDistance > 0 && (
                <Text style={styles.total}>
                  Total Distance: {totals.totalDistance} {userDistanceUnit}
                </Text>
              )}

              {/* Show Time only if duration was recorded */}
              {totals.totalTime > 0 && (
                <Text style={styles.total}>
                  Total Time: {formatHMS(totals.totalTime)}
                </Text>
              )}
            </View>


            <Pressable style={styles.saveButton} onPress={handleSaveWorkout}>
              <Text style={styles.saveText}>{id ? 'Save Changes' : 'Save Workout'}</Text>
            </Pressable>

            <Modal visible={modalVisible} animationType="slide">
              <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                <SafeAreaView style={styles.modalContainer}>
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
                        <Text style={{ color: '#777', fontSize: 12 }}>{item.category}</Text>
                      </Pressable>
                    )}
                  />
                  <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                    <Text style={{ color: '#fff' }}>Close</Text>
                  </Pressable>
                </SafeAreaView>
              </View>
            </Modal>
          </>
        )}
      />
    </KeyboardAvoidingView>
  );
}

// ---------------- Styles ----------------
const styles = StyleSheet.create({
  container: { padding: 20 },
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
        width: '100%',

  },
  smallSetInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 7,
    borderRadius: 6,
    textAlign: 'center',
    flex: 1,           // THIS IS KEY: It makes inputs share the remaining space
    marginHorizontal: 4, // Adds spacing between the inputs
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between', // This pushes one to the left and one to the right
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,      // Optional: adds a subtle separator line
    borderTopColor: '#2a2a2a',
  },
  addSetText: {
    color: '#4CAF50',
    fontWeight: '600',
    paddingVertical: 4,    // Increases the touch target
  },
  exerciseTrash: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,    // Increases the touch target
  },
  total: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: { flex: 1, backgroundColor: '#121212', padding: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 12 },
  searchInput: {
    backgroundColor: '#1f1f1f',
    color: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  exerciseItem: {
    padding: 12,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  closeButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },

  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 6,
  },
  tipText: {
    color: '#888',
    fontSize: 13,
    fontStyle: 'italic',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 2,
    marginBottom: -5, // Pulls the inputs closer to the labels
  },
  labelText: {
    color: '#555', // Subdued color
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    textAlign: 'center',
  },


});