import * as Haptics from 'expo-haptics';
import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

export const useShake = () => {
  const shakeOffset = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  const triggerShake = () => {
    // Tactile warning feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    // Visual horizontal shake sequence
    shakeOffset.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  return { animatedStyle, triggerShake };
};
