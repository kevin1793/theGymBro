// utils/helpers.ts

/**
 * Formats a number based on unit
 * - For seconds: displays Xm Ys if >= 60
 * - Otherwise, displays Xs or original unit
 */
export const formatTime = (value: number, unit: string): string => {
  if (unit !== 'seconds') return `${value} ${unit}`;

  if (value >= 60) {
    const mins = Math.floor(value / 60);
    const secs = value % 60;
    return `${mins}m ${secs}s`;
  } else {
    return `${value}s`;
  }
};
