import React, { createContext, ReactNode, useContext, useState } from 'react';

export type SetType = {
  reps?: string;
  weight?: string;
  distance?: string;
  minutes?: string;
  seconds?: string;
  type: 'warmup' | 'working';
};

export type ExerciseType = {
  name: string;
  category: string;
  sets: SetType[];
};

export type WorkoutType = {
  id: string;
  title: string;
  description?: string;
  exercises: ExerciseType[];
  createdAt?: any;
};

type WorkoutsContextType = {
  workouts: WorkoutType[];
  setWorkouts: (workouts: WorkoutType[]) => void;
  addOrUpdateWorkout: (workout: WorkoutType) => void;
  removeWorkout: (id: string) => void;
};

const WorkoutsContext = createContext<WorkoutsContextType | undefined>(undefined);

export const WorkoutsProvider = ({ children }: { children: ReactNode }) => {
  const [workouts, setWorkouts] = useState<WorkoutType[]>([]);

  const addOrUpdateWorkout = (workout: WorkoutType) => {
    setWorkouts(prev => {
      const filtered = prev.filter(w => w.id !== workout.id);
      return [workout, ...filtered];
    });
  };

  const removeWorkout = (id: string) => {
    setWorkouts(prev => prev.filter(w => w.id !== id));
  };

  return (
    <WorkoutsContext.Provider value={{ workouts, setWorkouts, addOrUpdateWorkout, removeWorkout }}>
      {children}
    </WorkoutsContext.Provider>
  );
};

export const useWorkouts = () => {
  const context = useContext(WorkoutsContext);
  if (!context) throw new Error('useWorkouts must be used within WorkoutsProvider');
  return context;
};
