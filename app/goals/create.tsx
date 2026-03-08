import { exercises } from '@/data/exercises';
import { auth } from '@/lib/firebase';
import { Goal, saveGoal } from '@/repositories/goalRepo';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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
import { useGoals } from '../../context/GoalsContext';


export default function CreateGoal() {
  const router = useRouter();
  const { addOrUpdateGoal, goals } = useGoals();
  const { id } = useLocalSearchParams<{ id?: string }>(); // optional goal id for editing

  const editingGoal = id ? goals.find(g => g.id === id) : undefined;

  const userWeightUnit: 'kg' | 'lbs' = 'lbs';
  const userDistanceUnit: 'km' | 'miles' = 'miles';

  // Form states (pre-filled if editing)
  const [title, setTitle] = useState(editingGoal?.title ?? '');
  const [exercise, setExercise] = useState<string | null>(editingGoal?.exercise ?? null);
  const [goalType, setGoalType] = useState<string | null>(editingGoal?.goalType ?? null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(
    exercises.map((ex) => ({ 
      label: ex.name, 
      value: ex.name, 
      category: ex.category // Add the category to each item
    }))
  );


  const [goalTypeOpen, setGoalTypeOpen] = useState(false);

  const [startValue, setStartValue] = useState(
    editingGoal && editingGoal.goalType !== 'time' ? String(editingGoal.startValue) : ''
  );
  const [currentValue, setCurrentValue] = useState(
    editingGoal && editingGoal.goalType !== 'time' ? String(editingGoal.currentValue) : ''
  );
  const [targetValue, setTargetValue] = useState(
    editingGoal && editingGoal.goalType !== 'time' ? String(editingGoal.targetValue) : ''
  );
  const [secondaryValue, setSecondaryValue] = useState(
    editingGoal?.secondaryValue ? String(editingGoal.secondaryValue) : ''
  );

  // Time inputs
  const [startMinutes, setStartMinutes] = useState(
    editingGoal?.goalType === 'time' ? Math.floor((editingGoal.startValue ?? 0) / 60) : 0
  );
  const [startSeconds, setStartSeconds] = useState(
    editingGoal?.goalType === 'time' ? (editingGoal.startValue ?? 0) % 60 : 0
  );
  const [currentMinutes, setCurrentMinutes] = useState(
    editingGoal?.goalType === 'time' ? Math.floor((editingGoal.currentValue ?? 0) / 60) : 0
  );
  const [currentSeconds, setCurrentSeconds] = useState(
    editingGoal?.goalType === 'time' ? (editingGoal.currentValue ?? 0) % 60 : 0
  );
  const [targetMinutes, setTargetMinutes] = useState(
    editingGoal?.goalType === 'time' ? Math.floor((editingGoal.targetValue ?? 0) / 60) : 0
  );
  const [targetSeconds, setTargetSeconds] = useState(
    editingGoal?.goalType === 'time' ? (editingGoal.targetValue ?? 0) % 60 : 0
  );

  const goalTypeOptions = [
    { label: '1 Rep Max', value: '1rep' },
    { label: 'Max Reps', value: 'max_reps' },
    { label: 'Time', value: 'time' },
    { label: 'Distance', value: 'distance' },
  ];

  const requiresSecondaryWeight = goalType === 'max_reps';
  

  const getMeasurementLabel = () => {
    switch (goalType) {
      case '1rep': return userWeightUnit;
      case 'max_reps': return 'reps';
      case 'distance': return userDistanceUnit;
      case 'time': return 'seconds';
      default: return '';
    }
  };

  const handleSave = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return console.log('User not logged in');

      const convertToSeconds = (min: string | number, sec: string | number) =>
        Number(min) * 60 + Number(sec);

      const goalData = {
        id: editingGoal?.id || Crypto.randomUUID(), // keep id if editing
        title,
        exercise,
        goalType,
        measurementType:
          goalType === '1rep' ? 'weight' :
          goalType === 'max_reps' ? 'reps' : goalType,
        unit:
          goalType === '1rep' ? userWeightUnit :
          goalType === 'max_reps' ? 'reps' :
          goalType === 'distance' ? userDistanceUnit : 'seconds',
        startValue: goalType === 'time'
          ? convertToSeconds(startMinutes, startSeconds)
          : Number(startValue),
        currentValue: goalType === 'time'
          ? convertToSeconds(currentMinutes, currentSeconds)
          : Number(currentValue),
        targetValue: goalType === 'time'
          ? convertToSeconds(targetMinutes, targetSeconds)
          : Number(targetValue),
        secondaryValue: requiresSecondaryWeight && secondaryValue ? Number(secondaryValue) : null,
        secondaryUnit: requiresSecondaryWeight ? userWeightUnit : null,
        completed: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      console.log('Saving goal:', goalData);
      // const savedGoal = await saveGoal(goalData);
      // addOrUpdateGoal(savedGoal);
      await saveGoal(goalData as Goal);
      addOrUpdateGoal(goalData as Goal);

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
              onPress={() => router.canGoBack() ? router.back() : router.push('/')}
              style={{ paddingHorizontal: 16 }}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </Pressable>
          ),
          title: editingGoal ? 'Edit Goal' : 'Create Goal',
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
            {/* <Text style={styles.header}>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</Text> */}

            {/* Title */}
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Bench Press Goal"
              placeholderTextColor="#777"
              value={title}
              onChangeText={setTitle}
            />

            {/* Exercise */}
            <Text style={styles.label}>Exercise</Text>
            <DropDownPicker
              renderListItem={(props) => {
                const { item, isSelected, onPress } = props;
                return (
                  <Pressable 
                    onPress={() => onPress(item)}
                    style={[
                      styles.listItemCustom, 
                      isSelected && { backgroundColor: '#1f1f1f' }
                    ]}
                  >
                    <View>
                      <Text style={styles.itemNameText}>{item.label}</Text>
                      <Text style={styles.itemCategoryText}>{item.category}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#4CAF50" />
                    )}
                  </Pressable>
                );
              }}
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
              searchTextInputStyle={{
                color: '#fff',            // Fixes the black text
                borderColor: '#333',     // Matches your dark theme
                backgroundColor: '#1f1f1f' // Matches your input style
              }}
            />

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

            {/* Numeric / Weight Inputs */}
            {goalType !== 'time' && (
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

            {/* Time Inputs */}
            {goalType === 'time' && (
              <>
                <Text style={styles.label}>Starting Time</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="Min"
                    placeholderTextColor="#777"
                    value={String(startMinutes)}
                    onChangeText={text => setStartMinutes(Number(text))}
                    keyboardType="numeric"
                  />
                  <Text style={styles.timeSeparator}>:</Text>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="Sec"
                    placeholderTextColor="#777"
                    value={String(startSeconds)}
                    onChangeText={text => setStartSeconds(Number(text))}
                    keyboardType="numeric"
                  />
                </View>

                <Text style={styles.label}>Current Time</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="Min"
                    placeholderTextColor="#777"
                    value={String(currentMinutes)}
                    onChangeText={text => setCurrentMinutes(Number(text))}
                    keyboardType="numeric"
                  />
                  <Text style={styles.timeSeparator}>:</Text>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="Sec"
                    placeholderTextColor="#777"
                    value={String(currentSeconds)}
                    onChangeText={text => setCurrentSeconds(Number(text))}
                    keyboardType="numeric"
                  />
                </View>

                <Text style={styles.label}>Target Time</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="Min"
                    placeholderTextColor="#777"
                    value={String(targetMinutes)}
                    onChangeText={text => setTargetMinutes(Number(text))}
                    keyboardType="numeric"
                  />
                  <Text style={styles.timeSeparator}>:</Text>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="Sec"
                    placeholderTextColor="#777"
                    value={String(targetSeconds)}
                    onChangeText={text => setTargetSeconds(Number(text))}
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}

            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>{editingGoal ? 'Update' : 'Save'}</Text>
            </Pressable>
          </>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  timeInput: { flex: 1, textAlign: 'center', marginBottom: 0 },
  timeSeparator: { color: '#fff', fontSize: 18, marginHorizontal: 8, fontWeight: '700' },
  container: { padding: 20 },
  header: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 20 },
  label: { color: '#aaa', fontSize: 14, marginBottom: 4, marginTop: 12 },
  input: { backgroundColor: '#1f1f1f', color: '#fff', padding: 12, borderRadius: 12, fontSize: 16, marginBottom: 16 },
  dropdown: { backgroundColor: '#1f1f1f', borderRadius: 12, borderColor: '#1f1f1f', marginBottom: 16 },
  dropdownContainer: { backgroundColor: '#1f1f1f', borderColor: '#1f1f1f', borderRadius: 12 },
  saveButton: { backgroundColor: '#4CAF50', padding: 16, borderRadius: 12, marginTop: 30, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  listItemCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  itemNameText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  itemCategoryText: {
    color: '#777', // Subdued color for category
    fontSize: 12,
    marginTop: 2,
  },
});