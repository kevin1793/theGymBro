import { exercises } from '@/data/exercises';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

export default function CreateGoal() {
  const router = useRouter();

  // General fields
  const [title, setTitle] = useState('');
  const [exercise, setExercise] = useState(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(
    exercises.map((ex) => ({ label: ex.name, value: ex.name }))
  );

  // Goal Type dropdown
  const [goalType, setGoalType] = useState(null);
  const [goalTypeOpen, setGoalTypeOpen] = useState(false);

  const goalTypeOptions = [
    { label: '1 Rep Max', value: '1rep' },
    { label: 'Max Reps', value: 'max_reps' },
    { label: 'Time', value: 'time' },
    { label: 'Distance', value: 'distance' },
    { label: 'Calories Burned', value: 'calories' },
  ];

  // Fields depending on goal type
  const [startingWeight, setStartingWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [startingDistance, setStartingDistance] = useState('');
  const [currentDistance, setCurrentDistance] = useState('');
  const [goalDistance, setGoalDistance] = useState('');
  const [startingTime, setStartingTime] = useState('');
  const [goalTime, setGoalTime] = useState('');

  const [weight, setWeight] = useState('');
const [startingReps, setStartingReps] = useState('');
const [currentReps, setCurrentReps] = useState('');
const [goalReps, setGoalReps] = useState('');

  const handleSave = () => {
    const goalData = {
      title,
      exercise,
      goalType,
      // Include fields based on goal type
      ...(goalType === '1rep' || goalType === 'max_reps'
        ? { startingWeight, goalWeight }
        : {}),
      ...(goalType === 'distance'
        ? { startingDistance, currentDistance, goalDistance }
        : {}),
      ...(goalType === 'time' ? { startingTime, goalTime } : {}),
    };

    console.log(goalData);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#121212' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <>
        <Stack.Screen
          options={{
            title: 'Create Goal',
            headerBackTitleVisible: false,
            headerTintColor: '#fff',
            headerBackTitle: 'Back',
            headerStyle: { backgroundColor: '#121212' },
          }}
        />
      </>
      <FlatList
        data={[{ key: 'form' }]}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.container}
        renderItem={() => (
          <>
            <Text style={styles.header}>Create New Goal</Text>

            {/* Title */}
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 1 Rep Max"
              placeholderTextColor="#777"
              value={title}
              onChangeText={setTitle}
            />

            {/* Exercise */}
            <Text style={styles.label}>Exercise</Text>
            <View style={{ zIndex: 1000 }}>
              <DropDownPicker
                open={open}
                value={exercise}
                items={items}
                setOpen={setOpen}
                setValue={setExercise}
                setItems={setItems}
                placeholder="Search or select an exercise..."
                searchable
                searchPlaceholder="Type to search..."
                listMode="MODAL"
                closeIconStyle={{ tintColor: '#fff' }}
                modalProps={{ animationType: 'slide' }}
                modalContentContainerStyle={{ backgroundColor: '#121212' }}
                searchTextInputStyle={{
                  color: '#fff',
                  borderWidth: 1,
                  borderColor: '#4CAF50',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  backgroundColor: '#121212',
                }}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={{ color: '#fff', fontSize: 16 }}
                placeholderStyle={{ color: '#777' }}
              />
            </View>

            {/* Goal Type */}
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

            {/* Conditional fields based on goal type */}
              {goalType === '1rep' && (
                <>
                  <Text style={styles.label}>Starting Weight</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 200"
                    placeholderTextColor="#777"
                    value={startingWeight}
                    onChangeText={setStartingWeight}
                    keyboardType="numeric"
                  />

                  <Text style={styles.label}>Goal Weight</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 315"
                    placeholderTextColor="#777"
                    value={goalWeight}
                    onChangeText={setGoalWeight}
                    keyboardType="numeric"
                  />
                </>
              )}

              {goalType === 'max_reps' && (
                <>
                  <Text style={styles.label}>Weight</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 100"
                    placeholderTextColor="#777"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                  />

                  <Text style={styles.label}>Starting Reps</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 5"
                    placeholderTextColor="#777"
                    value={startingReps}
                    onChangeText={setStartingReps}
                    keyboardType="numeric"
                  />

                  <Text style={styles.label}>Current Reps</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 8"
                    placeholderTextColor="#777"
                    value={currentReps}
                    onChangeText={setCurrentReps}
                    keyboardType="numeric"
                  />

                  <Text style={styles.label}>Goal Reps</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 12"
                    placeholderTextColor="#777"
                    value={goalReps}
                    onChangeText={setGoalReps}
                    keyboardType="numeric"
                  />
                </>
              )}

              {goalType === 'distance' && (
                <>
                  <Text style={styles.label}>Starting Distance</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 1 km"
                    placeholderTextColor="#777"
                    value={startingDistance}
                    onChangeText={setStartingDistance}
                    keyboardType="numeric"
                  />

                  <Text style={styles.label}>Current Distance</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 3 km"
                    placeholderTextColor="#777"
                    value={currentDistance}
                    onChangeText={setCurrentDistance}
                    keyboardType="numeric"
                  />

                  <Text style={styles.label}>Goal Distance</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 5 km"
                    placeholderTextColor="#777"
                    value={goalDistance}
                    onChangeText={setGoalDistance}
                    keyboardType="numeric"
                  />
                </>
              )}

              {goalType === 'time' && (
                <>
                  <Text style={styles.label}>Starting Time (minutes)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 5"
                    placeholderTextColor="#777"
                    value={startingTime}
                    onChangeText={setStartingTime}
                    keyboardType="numeric"
                  />

                  <Text style={styles.label}>Goal Time (minutes)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 10"
                    placeholderTextColor="#777"
                    value={goalTime}
                    onChangeText={setGoalTime}
                    keyboardType="numeric"
                  />
                </>
              )}


            {/* Save button */}
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Save Goal</Text>
            </Pressable>
          </>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
