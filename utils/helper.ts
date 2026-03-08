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


export const formatHMS = (seconds: number) => {
  console.log('Formatting time for total seconds:', seconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let str = '';
  if (h > 0) str += `${h}h `;
  if (m > 0) str += `${m}m `;
  if (s > 0) str += `${s}s`;
  return str.trim() || '0s';
};