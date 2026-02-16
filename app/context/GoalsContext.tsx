import React, { createContext, ReactNode, useContext, useState } from 'react';

export type GoalType = {
  id: string;
  title: string;
  exercise: string;
  goalType: string;
  unit: string;
  startValue: number;
  currentValue: number;
  targetValue: number;
  secondaryValue?: number | null;
  secondaryUnit?: string | null;
};

type GoalsContextType = {
  goals: GoalType[];
  setGoals: (goals: GoalType[]) => void;
  addOrUpdateGoal: (goal: GoalType) => void;
  removeGoal: (id: string) => void;
};

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const GoalsProvider = ({ children }: { children: ReactNode }) => {
  const [goals, setGoals] = useState<GoalType[]>([]);
  

  const addOrUpdateGoal = (goal: GoalType) => {
    setGoals(prev => {
      // Remove existing goal with same id
      const filtered = prev.filter(g => g.id !== goal.id);
      // Place updated/new goal at the front
      return [goal, ...filtered];
    });
  };

  const removeGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  return (
    <GoalsContext.Provider value={{ goals, setGoals, addOrUpdateGoal, removeGoal }}>
      {children}
    </GoalsContext.Provider>
  );
};

export const useGoals = () => {
  const context = useContext(GoalsContext);
  if (!context) throw new Error('useGoals must be used within GoalsProvider');
  return context;
};
