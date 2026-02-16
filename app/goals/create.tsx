import { exercises } from '@/data/exercises';
import { auth, db } from '@/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useGoals } from '../context/GoalsContext';

export default function CreateGoal() {
  const router = useRouter();
  const { addOrUpdateGoal } = useGoals(); // ✅ use context function

  const userWeightUnit: 'kg' | 'lbs' = 'lbs';
  const userDistanceUnit: 'km' | 'miles' = 'miles';

  const [title, setTitle] = useState('');
  const [exercise, setExercise] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(
    exercises.map((ex) => ({ label: ex.name, value: ex.name }))
  );

  const [goalType, setGoalType] = useState<string | null>(null);
  const [goalTypeOpen, setGoalTypeOpen] = useState(false);

  const goalTypeOptions = [
    { label: '1 Rep Max', value: '1rep' },
    { label: 'Max Reps', value: 'max_reps' },
    { label: 'Time', value: 'time' },
    { label: 'Distance', value: 'distance' },
  ];

  const [startValue, setStartValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [secondaryValue, setSecondaryValue] = useState('');

  const [startMinutes, setStartMinutes] = useState(0);
  const [startSeconds, setStartSeconds] = useState(0);
  const [currentMinutes, setCurrentMinutes] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [targetMinutes, setTargetMinutes] = useState(0);
  const [targetSeconds, setTargetSeconds] = useState(0);


  const getMeasurementLabel = () => {
    switch (goalType) {
      case '1rep': return userWeightUnit;
      case 'max_reps': return 'reps';
      case 'distance': return userDistanceUnit;
      case 'time': return 'seconds';
      default: return '';
    }
  };

  const requiresSecondaryWeight = goalType === 'max_reps';

  const handleSave = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return console.log('User not logged in');

    // Convert time inputs to total seconds
    const convertToSeconds = (min: string, sec: string) =>
      Number(min) * 60 + Number(sec);

    const goalData = {
      title,
      exercise,
      goalType,
      measurementType:
        goalType === '1rep' ? 'weight' :
        goalType === 'max_reps' ? 'reps' : goalType,
      unit:
        goalType === '1rep' ? userWeightUnit :
        goalType === 'max_reps' ? 'reps' :
        goalType === 'distance' ? 'km' : 'seconds',
      startValue: goalType === 'time' ? convertToSeconds(startMinutes, startSeconds) : Number(startValue),
      currentValue: goalType === 'time' ? convertToSeconds(currentMinutes, currentSeconds) : Number(currentValue),
      targetValue: goalType === 'time' ? convertToSeconds(targetMinutes, targetSeconds) : Number(targetValue),
      secondaryValue:
        requiresSecondaryWeight && secondaryValue ? Number(secondaryValue) : null,
      secondaryUnit: requiresSecondaryWeight ? userWeightUnit : null,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, 'users', user.uid, 'goals'),
      goalData
    );

    addOrUpdateGoal({ id: docRef.id, ...goalData });
    router.replace('/(tabs)');
  } catch (error) {
    console.log('Error saving goal:', error);
  }
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
            <Text style={styles.header}>Create New Goal</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Bench Press Goal"
              placeholderTextColor="#777"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Exercise</Text>
            <DropDownPicker
              open={open}
              value={exercise}
              items={items}
              setOpen={setOpen}
              setValue={setExercise}
              setItems={setItems}
              placeholder="Search or select an exercise..."
              searchable
              listMode="MODAL"
              modalProps={{ animationType: 'slide', presentationStyle: 'fullScreen' }}
              modalContentContainerStyle={{ flex: 1, backgroundColor: '#121212', paddingTop: 60 }}
              closeIconStyle={{ tintColor: '#fff' }}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              textStyle={{ color: '#fff', fontSize: 16 }}
              placeholderStyle={{ color: '#777' }}
            />

            <Text style={styles.label}>Goal Type</Text>
            <DropDownPicker
              open={goalTypeOpen}
              value={goalType}
              items={goalTypeOptions}
              setOpen={setGoalTypeOpen}
              setValue={setGoalType}
              placeholder="Select goal type..."
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              textStyle={{ color: '#fff', fontSize: 16 }}
              placeholderStyle={{ color: '#777' }}
            />

            {goalType !== 'time' &&
             (
              <>
                {requiresSecondaryWeight && (
                  <>
                    <Text style={styles.label}>Weight ({userWeightUnit})</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={`Ex: 100 ${userWeightUnit}`}
                      placeholderTextColor="#777"
                      value={secondaryValue}
                      onChangeText={setSecondaryValue}
                      keyboardType="numeric"
                    />
                  </>
                )}

                <Text style={styles.label}>Starting {getMeasurementLabel()}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter starting ${getMeasurementLabel()}`}
                  placeholderTextColor="#777"
                  value={startValue}
                  onChangeText={setStartValue}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>Current {getMeasurementLabel()}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter current ${getMeasurementLabel()}`}
                  placeholderTextColor="#777"
                  value={currentValue}
                  onChangeText={setCurrentValue}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>Goal {getMeasurementLabel()}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter goal ${getMeasurementLabel()}`}
                  placeholderTextColor="#777"
                  value={targetValue}
                  onChangeText={setTargetValue}
                  keyboardType="numeric"
                />
              </>
            )}

            {goalType === 'time' ? (
            <>
            <Text style={styles.label}>Starting Time</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="Min"
                placeholderTextColor="#777"
                value={startMinutes}
                onChangeText={setStartMinutes}
                keyboardType="numeric"
              />
              <Text style={styles.timeSeparator}>:</Text>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="Sec"
                placeholderTextColor="#777"
                value={startSeconds}
                onChangeText={setStartSeconds}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.label}>Current Time</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="Min"
                placeholderTextColor="#777"
                value={currentMinutes}
                onChangeText={setCurrentMinutes}
                keyboardType="numeric"
              />
              <Text style={styles.timeSeparator}>:</Text>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="Sec"
                placeholderTextColor="#777"
                value={currentSeconds}
                onChangeText={setCurrentSeconds}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.label}>Target Time</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="Min"
                placeholderTextColor="#777"
                value={targetMinutes}
                onChangeText={setTargetMinutes}
                keyboardType="numeric"
              />
              <Text style={styles.timeSeparator}>:</Text>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="Sec"
                placeholderTextColor="#777"
                value={targetSeconds}
                onChangeText={setTargetSeconds}
                keyboardType="numeric"
              />
            </View>
          </>
        ) : (
          <>
            {/* existing numeric inputs for other goal types */}
          </>
        )}


            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // time styles
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  timeInput: {
    flex: 1,
    textAlign: 'center',
    marginBottom: 0,
  },

  timeSeparator: {
    color: '#fff',
    fontSize: 18,
    marginHorizontal: 8,
    fontWeight: '700',
  },

  container: { padding: 20 },
  header: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 20 },
  label: { color: '#aaa', fontSize: 14, marginBottom: 4, marginTop: 12 },
  input: {
    backgroundColor: '#1f1f1f',
    color: '#fff',
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  dropdown: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    borderColor: '#1f1f1f',
    marginBottom: 16,
  },
  dropdownContainer: {
    backgroundColor: '#1f1f1f',
    borderColor: '#1f1f1f',
    borderRadius: 12,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
